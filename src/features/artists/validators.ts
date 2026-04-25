export async function validateMagicBytes(file: File, type: 'image' | 'pdf'): Promise<boolean> {
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if (type === 'pdf') {
        return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
    }
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng  = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    return isJpeg || isPng;
}
