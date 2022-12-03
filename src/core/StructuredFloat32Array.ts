export type TStructuredFloat32ArrayAcceptedTypes =
  | number
  | number[]
  | Float32Array;

class StructuredFloat32Array extends Float32Array {
  private metadata: {
    [key: string]: { index: number; length: number };
  } = {};
  private stride = 0;

  constructor(
    structure: {
      [key: string]:
        | TStructuredFloat32ArrayAcceptedTypes
        | (() => TStructuredFloat32ArrayAcceptedTypes);
    },
    count = 1
  ) {
    console.log(count);
    const arrayData: number[] = [];
    const metadata = {};
    let stride = 0;
    const itemsCount = Object.keys(structure).length;
    const entries = [...Object.entries(structure).entries()];

    for (let i = 0; i < count; i++) {
      for (let [index, item] of entries) {
        const key = item[0];
        let value = item[1];
        let arrayIndex = arrayData.length;

        value = value instanceof Function ? value() : value;
        value = value instanceof Float32Array ? Array.from(value) : value;

        if (Array.isArray(value)) {
          console.log(value);
          const rowSpace = 4 - (arrayIndex % 4);

          switch (rowSpace) {
            case 1: {
              arrayData.push(0); // padding
              break;
            }
            case 2: {
              if (value.length > 2) {
                arrayData.push(0, 0); // padding
              }
              break;
            }
            case 3: {
              if (value.length === 2) {
                arrayData.push(0);
              } else {
                arrayData.push(0, 0, 0);
              }
              break;
            }
            default: {
              break;
            }
          }
          arrayIndex = arrayData.length;
          arrayData.push(...value);
        } else {
          arrayData.push(value);
        }

        metadata[key] = {
          index: arrayIndex,
          length: Array.isArray(value) ? value.length : 1,
        };

        if (index === itemsCount - 1 && count > 1) {
          const endPadding = 4 - (arrayData.length % 4);
          for (let i = 0; i < endPadding; i++) {
            arrayData.push(0);
          }
          if (i === 0) {
            stride = arrayData.length;
          }
        }
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
}

export default StructuredFloat32Array;
