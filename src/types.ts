export type NumberType = 'uint' | 'int' | 'float';

export type NumberByteLength = 1 | 2 | 4;

export type MetaField = {
  name: string
  byteOffset: number
  byteLength: number
};

export type RawField = MetaField & {
  type: 'raw'
};

export type NumberField = Omit<MetaField, 'byteLength'> & {
  type: NumberType
  byteLength: NumberByteLength
};

export type StringField = MetaField & {
  type: 'string'
};

export type BitmaskField = MetaField & {
  type: 'bitmask'
  map: BitmaskMap
};

export type BitmaskMap = Record<string, BitField>;

export type BitField = BooleanBitField | UintBitField | EnumBitField;

export type BitPosition = number;

export type BitRange = [start: number, end: number];

export type BooleanBitField = {
  bits: BitPosition
  type: 'boolean'
};

export type UintBitField = {
  bits: BitPosition | BitRange
  type: 'uint'
};

export interface EnumBitField {
  bits: BitPosition | BitRange
  type: 'enum'
  values: string[]
}

export type Field =
  | RawField
  | NumberField
  | StringField
  | BitmaskField;

export type CodecSpec = {
  byteLength: number
  fields: Field[]
};
