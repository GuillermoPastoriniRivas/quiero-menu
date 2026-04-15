export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class RestaurantNotFoundError extends DomainError {
  constructor() {
    super('RESTAURANT_NOT_FOUND', 'Restaurant not found.');
  }
}

export class SlugAlreadyExistsError extends DomainError {
  constructor() {
    super('SLUG_ALREADY_EXISTS', 'A restaurant with this slug already exists.');
  }
}

export class RestaurantPausedError extends DomainError {
  constructor() {
    super('RESTAURANT_PAUSED', 'This restaurant is currently not accepting orders.');
  }
}

export class MenuCategoryNotFoundError extends DomainError {
  constructor() {
    super('MENU_CATEGORY_NOT_FOUND', 'Menu category not found.');
  }
}

export class MenuItemNotFoundError extends DomainError {
  constructor() {
    super('MENU_ITEM_NOT_FOUND', 'Menu item not found.');
  }
}

export class MenuItemVariantNotFoundError extends DomainError {
  constructor() {
    super('MENU_ITEM_VARIANT_NOT_FOUND', 'Menu item variant not found.');
  }
}

export class MenuItemOptionNotFoundError extends DomainError {
  constructor() {
    super('MENU_ITEM_OPTION_NOT_FOUND', 'Menu item option not found.');
  }
}

export class OrderNotFoundError extends DomainError {
  constructor() {
    super('ORDER_NOT_FOUND', 'Order not found.');
  }
}

export class InvalidOrderTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super('INVALID_ORDER_TRANSITION', `Cannot transition order from '${from}' to '${to}'.`);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid email or password.');
  }
}

export class EmailAlreadyExistsError extends DomainError {
  constructor() {
    super('EMAIL_ALREADY_EXISTS', 'A user with this email already exists.');
  }
}

export class UserNotFoundError extends DomainError {
  constructor() {
    super('USER_NOT_FOUND', 'User not found.');
  }
}

export class CrossRestaurantAccessError extends DomainError {
  constructor() {
    super('CROSS_RESTAURANT_ACCESS', 'Cannot access resources from a different restaurant.');
  }
}

export class KitchenTokenInvalidError extends DomainError {
  constructor() {
    super('KITCHEN_TOKEN_INVALID', 'Kitchen access token is invalid or expired.');
  }
}

export class DeliveryZoneNotFoundError extends DomainError {
  constructor() {
    super('DELIVERY_ZONE_NOT_FOUND', 'Delivery zone not found.');
  }
}

export class InvalidTokenError extends DomainError {
  constructor() {
    super('INVALID_TOKEN', 'The token is invalid or has already been used.');
  }
}

export class TokenExpiredError extends DomainError {
  constructor() {
    super('TOKEN_EXPIRED', 'The token has expired.');
  }
}
