import QRCode from "qrcode";

export async function createQR(input: string): Promise<string> {
    //Just in case
    input = input.trim();

    try {
        const dataUrl: string = await QRCode.toDataURL(input, {
            errorCorrectionLevel: 'M',
            margin: 2,
            scale: 8
        });

        return "success"+dataUrl;
    } catch (err) {
        return "fail"
    }
}