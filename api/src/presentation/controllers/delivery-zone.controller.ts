import { Controller, Get, Post, Patch, Delete, Param, Body, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { CreateDeliveryZoneRequestSchema, CreateDeliveryZoneRequestDto, UpdateDeliveryZoneRequestSchema, UpdateDeliveryZoneRequestDto } from '../request-dtos/delivery-zone.dto.js';
import type { CreateDeliveryZoneUseCase } from '../../application/use-cases/delivery-zone/create-delivery-zone.use-case.js';
import type { ListDeliveryZonesUseCase } from '../../application/use-cases/delivery-zone/list-delivery-zones.use-case.js';
import type { UpdateDeliveryZoneUseCase } from '../../application/use-cases/delivery-zone/update-delivery-zone.use-case.js';
import type { DeleteDeliveryZoneUseCase } from '../../application/use-cases/delivery-zone/delete-delivery-zone.use-case.js';

@Controller('delivery-zones')
export class DeliveryZoneController {
  constructor(
    @Inject('CreateDeliveryZoneUseCase') private readonly createZone: CreateDeliveryZoneUseCase,
    @Inject('ListDeliveryZonesUseCase') private readonly listZones: ListDeliveryZonesUseCase,
    @Inject('UpdateDeliveryZoneUseCase') private readonly updateZone: UpdateDeliveryZoneUseCase,
    @Inject('DeleteDeliveryZoneUseCase') private readonly deleteZone: DeleteDeliveryZoneUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    return this.listZones.execute(user.restaurantId);
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateDeliveryZoneRequestSchema)) body: CreateDeliveryZoneRequestDto) {
    const result = await this.createZone.execute({ ...body, restaurantId: user.restaurantId });
    if (!result.ok) throw new NotFoundException(result.error);
    return result.value;
  }

  @Patch(':id')
  async update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateDeliveryZoneRequestSchema)) body: UpdateDeliveryZoneRequestDto) {
    const result = await this.updateZone.execute(id, user.restaurantId, body);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Delete(':id')
  async delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.deleteZone.execute(id, user.restaurantId);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return { success: true };
  }
}
