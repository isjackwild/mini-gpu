export type TStructuredFloat32ArrayAcceptedTypes =
  | number
  | number[]
  | Float32Array;

class StructuredFloat32Array extends Float32Array {
  private metadata: {
    [key: string]: { index: number; length: number; isArray: boolean };
  } = {};
  private stride = 0;

  private static calculatePadding(
    arrayLength: number,
    nextItemValue: number | number[]
  ): number {
    const rowSpace = 4 - (arrayLength % 4);
    // if (
    //   (nextItemValue === null || nextItemValue === undefined) &&
    //   rowSpace % 2 === 1
    // ) {
    //   return rowSpace;
    // }
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

  constructor(
    structure: {
      [key: string]:
        | TStructuredFloat32ArrayAcceptedTypes
        | (() => TStructuredFloat32ArrayAcceptedTypes);
    },
    public count = 1
  ) {
    const arrayData: number[] = [];
    const metadata = {};
    let stride = 0;
    const entries = [...Object.entries(structure)];

    for (let i = 0; i < count; i++) {
      for (let iE = 0; iE < entries.length; iE++) {
        const item = entries[iE];
        const key = item[0];
        let value = item[1];
        let arrayIndex = arrayData.length;

        value = value instanceof Function ? value() : value;
        value = value instanceof Float32Array ? Array.from(value) : value;

        metadata[key] = {
          index: arrayIndex,
          length: Array.isArray(value) ? value.length : 1,
          isArray: Array.isArray(value),
        };

        if (Array.isArray(value)) {
          arrayData.push(...value);
        } else {
          arrayData.push(value);
        }

        let nextValue = entries[iE + 1] ? entries[iE + 1][1] : entries[0];
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
    this.stride = stride;
  }

  public getValueAt(key: string, arrayIndex = 0) {
    const { index, length } = this.metadata[key];

    if (length > 1) {
      return Array.from(this.slice(index + arrayIndex * this.stride, length));
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
          // console.log(value.length)
          const type = value.isArray ? `vec${value.length}<f32>` : "f32";
          if (acc === "") {
            return `${key} : ${type},`;
          } else {
            return `${acc}
        ${key} : ${type},`;
          }
        }, "")}
    }`;
  }
}

export default StructuredFloat32Array;
