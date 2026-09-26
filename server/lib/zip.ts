import { crc32, deflateRawSync } from 'node:zlib'

// A minimal zip writer for the Hackytel bundle: deflated entries, UTF-8 names, one
// central directory, no zip64 (a bundle is a few megabytes). Written by hand so the
// export adds no dependency; Hackytel reads it with its own equally small reader.

export type ZipEntry = { name: string; data: Buffer }

const LOCAL = 0x04034b50
const CENTRAL = 0x02014b50
const END = 0x06054b50
const VERSION = 20
const UTF8_NAMES = 0x0800
const DEFLATE = 8

type Packed = { name: Buffer; data: Buffer; crc: number; size: number; offset: number }

/** Date and time in MS-DOS form, which is what zip stores. Two-second resolution. */
const dosStamp = (date: Date): { time: number; day: number } => ({
  time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
  day: ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
})

// The fields local and central headers share, from "version needed" to the name length.
const commonFields = (entry: Packed, time: number, day: number): Buffer => {
  const b = Buffer.alloc(26)
  b.writeUInt16LE(VERSION, 0)
  b.writeUInt16LE(UTF8_NAMES, 2)
  b.writeUInt16LE(DEFLATE, 4)
  b.writeUInt16LE(time, 6)
  b.writeUInt16LE(day, 8)
  b.writeUInt32LE(entry.crc, 10)
  b.writeUInt32LE(entry.data.length, 14)
  b.writeUInt32LE(entry.size, 18)
  b.writeUInt16LE(entry.name.length, 22)
  b.writeUInt16LE(0, 24)
  return b
}

const localHeader = (entry: Packed, time: number, day: number): Buffer => {
  const signature = Buffer.alloc(4)
  signature.writeUInt32LE(LOCAL, 0)
  return Buffer.concat([signature, commonFields(entry, time, day), entry.name])
}

const centralHeader = (entry: Packed, time: number, day: number): Buffer => {
  const head = Buffer.alloc(6)
  head.writeUInt32LE(CENTRAL, 0)
  head.writeUInt16LE(VERSION, 4)
  // Comment length, disk number, internal and external attributes: all zero. Then the offset.
  const tail = Buffer.alloc(14)
  tail.writeUInt32LE(entry.offset, 10)
  return Buffer.concat([head, commonFields(entry, time, day), tail, entry.name])
}

const endRecord = (count: number, size: number, offset: number): Buffer => {
  const b = Buffer.alloc(22)
  b.writeUInt32LE(END, 0)
  b.writeUInt16LE(count, 8)
  b.writeUInt16LE(count, 10)
  b.writeUInt32LE(size, 12)
  b.writeUInt32LE(offset, 16)
  return b
}

/** Packs the entries into one zip archive, all stamped with `date`. */
export const writeZip = (entries: ZipEntry[], date: Date): Buffer => {
  const { time, day } = dosStamp(date)
  const locals: Buffer[] = []
  const packed: Packed[] = []
  let offset = 0
  for (const entry of entries) {
    const item: Packed = {
      name: Buffer.from(entry.name, 'utf-8'),
      data: deflateRawSync(entry.data),
      crc: crc32(entry.data),
      size: entry.data.length,
      offset,
    }
    const local = Buffer.concat([localHeader(item, time, day), item.data])
    locals.push(local)
    packed.push(item)
    offset += local.length
  }
  const central = Buffer.concat(packed.map((item) => centralHeader(item, time, day)))
  return Buffer.concat([...locals, central, endRecord(packed.length, central.length, offset)])
}
