export type TStructuredFloat32ArrayAcceptedTypes =
  | number
  | number[]
  | Float32Array;

export type TStructuredFloat32ArrayStructure = {
  [key: string]:
    | TStructuredFloat32ArrayAcceptedTypes
    | (() => TStructuredFloat32ArrayAcceptedTypes);
};

type TStructuredFloat32ArrayMemberMeta = {
  index: number;
  length: number;
  isArray: boolean;
};

class StructuredFloat32Array extends Float32Array {
  private metadata: {
    [key: string]: TStructuredFloat32ArrayMemberMeta;
  } = {};
  private _stride = 0;

  private static calculatePadding(
    arrayLength: number,
    nextItemValue: number | number[]
  ): number {
    const rowSpace = 4 - (arrayLength % 4);
    if (rowSpace === 4) return 0;
    if (nextItemValue === null || nextItemValue === undefined) {
      return rowSpace;
    }

    if (Array.isArray(nextItemValue)) {
      switch (rowSpace) {
        case 1: {
          return 1;
        }
        case 2: {
          if (nextItemValue.length > 2) {
            return 2;
          }
          break;
        }
        case 3: {
          if (nextItemValue.length === 2) {
            return 1;
          } else {
            return 3;
          }
        }
      }
    }

    return 0;
  }

  private static inferMemberType(member: TStructuredFloat32ArrayMemberMeta) {
    const possibleTypes = [];
    if (!member.isArray) {
      return "f32";
    } else {
      if (member.length <= 4) {
        possibleTypes.push(`vec${member.length}<f32>`);
      }
      if (member.length == 4) {
        possibleTypes.push("mat2x2<f32>");
      }
      if (member.length == 6) {
        possibleTypes.push("mat2x3<f32>");
        possibleTypes.push("mat3x2<f32>");
      }
      if (member.length == 8) {
        possibleTypes.push("mat2x4<f32>");
        possibleTypes.push("mat4x2<f32>");
      }
      if (member.length == 9) {
        possibleTypes.push("mat3x3<f32>");
      }
      if (member.length == 12) {
        possibleTypes.push("mat3x4<f32>");
        possibleTypes.push("mat4x3<f32>");
      }
      if (member.length == 16) {
        possibleTypes.push("mat4x4<f32>");
      }

      possibleTypes.push(`array<T, N>`);
    }

    return `[${possibleTypes.join(" OR ")}]`;
  }

  constructor(
    _structure:
      | TStructuredFloat32ArrayStructure
      | ((index: number) => TStructuredFloat32ArrayStructure),
    public count = 1
  ) {
    const arrayData: number[] = [];
    const metadata = {};
    let stride = 0;

    let structure = _structure;
    let entries;
    if (typeof structure !== "function") {
      entries = [...Object.entries(structure)];
    }

    for (let i = 0; i < count; i++) {
      if (typeof structure === "function") {
        entries = [...Object.entries(structure(i))];
      }
      for (let iE = 0; iE < entries.length; iE++) {
        const item = entries[iE];
        const key = item[0];
        let value = item[1];
        let arrayIndex = arrayData.length;

        value = value instanceof Function ? value() : value;
        value = value instanceof Float32Array ? Array.from(value) : value;

        if (i === 0) {
          metadata[key] = {
            index: arrayIndex,
            length: Array.isArray(value) ? value.length : 1,
            isArray: Array.isArray(value),
          };
        }

        if (Array.isArray(value)) {
          arrayData.push(...value);
        } else {
          arrayData.push(value);
        }

        // let nextValue = entries[iE + 1] ? entries[iE + 1][1] : null;
        let nextValue = entries[iE + 1] ? entries[iE + 1][1] : entries[0][1];

        if (nextValue) {
          nextValue = nextValue instanceof Function ? nextValue() : nextValue;
          nextValue =
            nextValue instanceof Float32Array
              ? Array.from(nextValue)
              : nextValue;
        }

        const padding = StructuredFloat32Array.calculatePadding(
          arrayData.length,
          nextValue as any
        );

        for (let i = 0; i < padding; i++) {
          arrayData.push(0);
        }
      }
      if (i === 0) {
        stride = arrayData.length;
      }
    }

    super(arrayData);
    this.metadata = metadata;
    this._stride = stride;
  }

  public get stride(): number {
    return this._stride;
  }

  public getValueAt(key: string, arrayIndex = 0) {
    const { index, length } = this.metadata[key];
    if (length > 1) {
      return Array.from(
        new Float32Array(this.buffer).slice(
          index + arrayIndex * this.stride,
          index + arrayIndex * this.stride + length
        )
      );
    }
    return this[index + arrayIndex * this.stride];
  }

  public setValueAt(
    key: string,
    value: TStructuredFloat32ArrayAcceptedTypes,
    arrayIndex = 0
  ): void {
    const { index } = this.metadata[key];

    if (value instanceof Float32Array) {
      value = Array.from(value);
    }
    if (Array.isArray(value)) {
      this.set(value, index + arrayIndex * this.stride);
    } else {
      this.set([value], index + arrayIndex * this.stride);
    }
  }

  public getWgslChunk(name: string = "MyStruct"): string {
    const members = Object.entries(this.metadata);
    return `
    struct ${name} {
        ${members.reduce((acc, [key, value]) => {
          if (acc === "") {
            return `${key} : ${StructuredFloat32Array.inferMemberType(value)},`;
          } else {
            return `${acc}
        ${key} : ${StructuredFloat32Array.inferMemberType(value)},`;
          }
        }, "")}
    }`;
  }
}

export default StructuredFloat32Array;
