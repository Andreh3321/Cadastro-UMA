import { v2 as cloudinary } from "cloudinary";

export async function storagePutPhoto(data, contentType = "application/octet-stream") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Configuração do Cloudinary ausente");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "umadeb-jovens/fotos",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("O Cloudinary não retornou o arquivo enviado"));
          return;
        }

        resolve({ url: result.secure_url });
      },
    );

    upload.end(data);
  });
}