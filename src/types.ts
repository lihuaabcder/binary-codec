export type NumberType = 'uint' | 'int' | 'float';

export type NumberByteLength = 1 | 2 | 4;

export type MetaField = {
  name: string
  byteOffset: number
  byteLength: number
  littleEndian?: boolean
};

export type RawField = MetaField & {
  type: 'raw'
};

export type NumberField = Omit<MetaField, 'byteLength'> & {
  type: NumberType
  byteLength: NumberByteLength
};

// TODO encoding...
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

export type EnumBitField = {
  bits: BitPosition | BitRange
  type: 'enum'
  values: string[]
};

export type ArrayField = MetaField & {
  type: 'array'
  item: ArrayItemField
};

export type ArrayItemField = Omit<Exclude<Field, ArrayField>, 'byteOffset' | 'name'>;

export type Field =
  | RawField
  | NumberField
  | StringField
  | BitmaskField
  | ArrayField;

// export type FieldReturnType<F extends Field> =
//   F extends NumberField ? number :
//     F extends StringField ? string :
//       F extends BitmaskField ? Record<string, boolean | number> :
//         F extends RawField ? Uint8Array :
//           F extends ArrayField
//             ? Array<FieldReturnType<Extract<ArrayItemField & { byteOffset: number }, Field>>>
//             : unknown;

export type CodecSpec = {
  byteLength: number
  fields: Field[]
};
