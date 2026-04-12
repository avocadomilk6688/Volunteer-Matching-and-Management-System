import { Repository, ObjectLiteral } from 'typeorm';

export async function generateCustomId<T extends ObjectLiteral>(
  repository: Repository<T>,
  prefix: string,
  idColumnName: string = 'id',
): Promise<string> {
  // Find the record with the highest ID
  const lastRecord = await repository
    .createQueryBuilder('entity')
    .select(`entity.${idColumnName}`)
    .orderBy(`entity.${idColumnName}`, 'DESC')
    .getOne();

  if (!lastRecord) {
    // If table is empty, start with 001
    return `${prefix}001`;
  }

  // Extract the number safely
  // We cast lastRecord to a Record to satisfy the 'no-unsafe-member-access' rule

  const recordData = lastRecord as Record<string, unknown>;
  const lastId = recordData[idColumnName] as string;

  const numericPart = lastId.replace(prefix, '');
  const nextNumber = parseInt(numericPart, 10) + 1;

  // Format back to string (e.g., 2 -> "002")
  const paddedNumber = nextNumber.toString().padStart(3, '0');

  return `${prefix}${paddedNumber}`;
}
