import { IsString, MaxLength, MinLength, IsOptional, IsHexColor, IsIn, IsArray, IsBoolean } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  name: string;

  @IsString()
  @MaxLength(16)
  icon: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsIn(['daily', 'custom'])
  frequencyType?: 'daily' | 'custom';

  // custom 模式下，21 个布尔值标识哪些天是目标日
  @IsOptional()
  @IsArray()
  @IsBoolean({ each: true })
  targetDays?: boolean[];
}