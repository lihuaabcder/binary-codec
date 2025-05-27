export type NumberType =
  | 'uint8'
  | 'int8'
  | 'uint16'
  | 'int16'
  | 'uint32'
  | 'int32'
  | 'float32'
  | 'float64';

export type MetaField = {
  name: string
  byteOffset: number
  byteLength: number
};

export type RawField = MetaField & {
  type: 'raw'
};

export type NumberField = MetaField & {
  type: 'number'
};

export type StringField = MetaField & {
  type: 'string'
};

export type Field = RawField | NumberField | StringField;

export type CodecSpec = {
  byteLength: number
  fields: Field[]
};
