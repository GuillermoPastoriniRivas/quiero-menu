import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  MenuVisionPort,
  MenuVisionInput,
  MenuVisionOutput,
} from '../../application/ports/menu-vision.port.js';

const SYSTEM_PROMPT = `You are a restaurant menu data extraction assistant. Analyze the provided menu image(s) and optional text description to extract a structured menu for a digital ordering system.

Extract the following:

1. RESTAURANT INFO: name, phone number, address, city if visible on the menu.

2. OPERATING HOURS: if visible, extract as array of { dayOfWeek (0=Sunday, 1=Monday...6=Saturday), opensAt (HH:mm), closesAt (HH:mm), isClosed: false }. Only include days you can see.

3. MENU CATEGORIES: group items into logical categories (e.g., "Entradas", "Platos principales", "Bebidas", "Postres"). Use the categories visible on the menu. If no categories are explicit, infer reasonable ones.

4. MENU ITEMS: for each item extract:
   - name: exact name as shown
   - description: if not visible, generate a brief appetizing description in the same language as the menu (1 sentence)
   - basePrice: numeric price without currency symbols
   - itemType: "simple" for regular items, "variant" if the item has size/type variations
   - variants: if itemType is "variant", list each variant with name and priceOverride (the full price for that variant, or null if same as basePrice)
   - options: if add-ons/extras/toppings are listed, extract as { name, priceDelta (additional cost), optionGroup (e.g. "Extras", "Salsas") }

Rules:
- Prices must be numbers without currency symbols.
- If a price range is shown (e.g., "$10-15"), use the lowest as basePrice and create variants for sizes.
- If additional text is provided, use it to supplement or correct what you see in the images.
- Generate descriptions in the same language as the menu.
- Be thorough: extract every item you can see.`;

const JSON_SCHEMA = {
  name: 'menu_extraction',
  strict: true,
  schema: {
    type: 'object',
    required: ['restaurant', 'categories'],
    additionalProperties: false,
    properties: {
      restaurant: {
        type: 'object',
        required: ['name', 'phone', 'address', 'city', 'currency'],
        additionalProperties: false,
        properties: {
          name: { type: ['string', 'null'] },
          phone: { type: ['string', 'null'] },
          address: { type: ['string', 'null'] },
          city: { type: ['string', 'null'] },
          currency: { type: ['string', 'null'] },
        },
      },
      operatingHours: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          required: ['dayOfWeek', 'opensAt', 'closesAt', 'isClosed'],
          additionalProperties: false,
          properties: {
            dayOfWeek: { type: 'number' },
            opensAt: { type: 'string' },
            closesAt: { type: 'string' },
            isClosed: { type: 'boolean' },
          },
        },
      },
      categories: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'description', 'items'],
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'description', 'basePrice', 'itemType'],
                additionalProperties: false,
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  basePrice: { type: 'number' },
                  itemType: { type: 'string', enum: ['simple', 'variant', 'combo'] },
                  variants: {
                    type: ['array', 'null'],
                    items: {
                      type: 'object',
                      required: ['name', 'priceOverride'],
                      additionalProperties: false,
                      properties: {
                        name: { type: 'string' },
                        priceOverride: { type: ['number', 'null'] },
                      },
                    },
                  },
                  options: {
                    type: ['array', 'null'],
                    items: {
                      type: 'object',
                      required: ['name', 'priceDelta', 'optionGroup'],
                      additionalProperties: false,
                      properties: {
                        name: { type: 'string' },
                        priceDelta: { type: 'number' },
                        optionGroup: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

@Injectable()
export class OpenAiMenuVisionService implements MenuVisionPort {
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('openai.apiKey')!;
  }

  async analyzeMenu(input: MenuVisionInput): Promise<MenuVisionOutput> {
    const userContent: unknown[] = [];

    for (let i = 0; i < input.imageBuffers.length; i++) {
      const base64 = input.imageBuffers[i].toString('base64');
      const mime = input.imageMimeTypes[i];
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${base64}` },
      });
    }

    let textPart = `Currency context: ${input.currency}`;
    if (input.additionalText) {
      textPart += `\n\nAdditional context from the restaurant owner:\n${input.additionalText}`;
    }
    userContent.push({ type: 'text', text: textPart });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_schema', json_schema: JSON_SCHEMA },
        max_tokens: 16384,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned no content');
    }

    const parsed: MenuVisionOutput = JSON.parse(content);

    // Normalize nulls to undefined/empty
    parsed.restaurant = {
      name: parsed.restaurant.name ?? undefined,
      phone: parsed.restaurant.phone ?? undefined,
      address: parsed.restaurant.address ?? undefined,
      city: parsed.restaurant.city ?? undefined,
      currency: parsed.restaurant.currency ?? undefined,
    };
    parsed.operatingHours = parsed.operatingHours ?? undefined;
    for (const cat of parsed.categories) {
      for (const item of cat.items) {
        item.variants = item.variants ?? undefined;
        item.options = item.options ?? undefined;
      }
    }

    return parsed;
  }
}
