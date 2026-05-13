import { IsBoolean } from 'class-validator';

export class ConsumePrescriptionDto {
  @IsBoolean()
  consume!: boolean;
}