exports.handler = async (event) => {
  // Chỉ cho phép yêu cầu POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Không tìm thấy mô tả (prompt) trong yêu cầu.' }) 
      };
    }

    // Lấy API key từ biến môi trường của Netlify một cách an toàn
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("Khóa API của Google chưa được cấu hình trên máy chủ.");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    const payload = {
      instances: [{ prompt: prompt }],
      parameters: { "sampleCount": 1 }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Google API Error:", errorBody);
        throw new Error(`Lỗi từ API của Google: ${errorBody.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const imageBase64 = result.predictions?.[0]?.bytesBase64Encoded;

    if (!imageBase64) {
      throw new Error("Không nhận được dữ liệu hình ảnh từ API của Google.");
    }

    // Gửi dữ liệu hình ảnh về lại cho trình duyệt
    return {
      statusCode: 200,
      body: JSON.stringify({ imageBase64: imageBase64 }),
    };

  } catch (error) {
    console.error('Lỗi trong Netlify Function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
