import { env } from 'cloudflare:workers';
export async function POST(request: Request) {
  try {
    const form=await request.formData();const files=form.getAll('files');
    if(!files.length||files.length>3)return Response.json({error:'Chọn từ 1 đến 3 ảnh.'},{status:400});
    const paths:string[]=[];
    for(const value of files){
      if(!(value instanceof File)||!['image/jpeg','image/png','image/webp'].includes(value.type)||value.size>5*1024*1024)return Response.json({error:'Ảnh phải là JPG, PNG hoặc WebP và không quá 5 MB.'},{status:400});
    }
    for(const value of files){
      const file=value as File;const key='references/'+crypto.randomUUID();
      await env.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
      paths.push('/api/uploads?key='+encodeURIComponent(key));
    }
    return Response.json({paths});
  }catch{return Response.json({error:'Không thể lưu ảnh. Vui lòng thử lại.'},{status:500});}
}
export async function GET(request:Request){
  try{
    const key=new URL(request.url).searchParams.get('key')||'';
    if(!/^references\/[a-f0-9-]{36}$/.test(key))return new Response('Không tìm thấy',{status:404});
    const object=await env.BUCKET.get(key);if(!object)return new Response('Không tìm thấy',{status:404});
    return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});
  }catch{return new Response('Không thể tải ảnh',{status:503});}
}
