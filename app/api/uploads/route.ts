import { env } from 'cloudflare:workers';
import { siteAdmin, privateHeaders } from '../../../lib/site-admin';
import { registerMedia } from '../../../lib/cms-resources';
import { inspectUploadedImage } from '../../../lib/image-upload.mjs';
export async function POST(request: Request) {
  if (!await siteAdmin(request)) return Response.json({error:'Cần quyền quản trị để tải ảnh.'},{status:401,headers:privateHeaders});
  try {
    const form=await request.formData();const files=form.getAll('files');
    if(!files.length||files.length>3)return Response.json({error:'Chọn từ 1 đến 3 ảnh.'},{status:400});
    if(!env.BUCKET)return Response.json({error:'Kho ảnh chưa được cấu hình.'},{status:503,headers:privateHeaders});
    const paths:string[]=[];
    const validated: Array<{ bytes: ArrayBuffer; type: string }> = [];
    for(const value of files){
      if(!(value instanceof File)||!['image/jpeg','image/png','image/webp'].includes(value.type)||value.size>5*1024*1024)return Response.json({error:'Ảnh phải là JPG, PNG hoặc WebP và không quá 5 MB.'},{status:400});
      const bytes = await value.arrayBuffer();
      try { inspectUploadedImage(bytes, value.type); validated.push({ bytes, type: value.type }); }
      catch { return Response.json({error:'Nội dung ảnh không hợp lệ hoặc kích thước ảnh vượt giới hạn. Chọn ảnh PNG, JPG hoặc WebP thật.'},{status:400,headers:privateHeaders}); }
    }
    for(const image of validated){
      const key='references/'+crypto.randomUUID();
      await env.BUCKET.put(key,image.bytes,{httpMetadata:{contentType:image.type}});
      paths.push('/api/uploads?key='+encodeURIComponent(key));
    }
    try {
      await registerMedia(paths.map((src, index) => ({ src, title: (files[index] as File).name.slice(0, 140), category: 'uploads', alt: '', desc: '' })));
    } catch {
      // The upload still returns a usable path; callers can add its metadata later.
      return Response.json({paths, libraryWarning:'Ảnh đã tải lên. Chưa ghi được vào thư viện, hãy thêm bằng đường dẫn.'});
    }
    return Response.json({paths});
  }catch{return Response.json({error:'Không thể lưu ảnh. Vui lòng thử lại.'},{status:500});}
}
export async function GET(request:Request){
  try{
    if(!env.BUCKET)return new Response('Không tìm thấy',{status:404});
    const key=new URL(request.url).searchParams.get('key')||'';
    if(!/^references\/[a-f0-9-]{36}$/.test(key))return new Response('Không tìm thấy',{status:404});
    const object=await env.BUCKET.get(key);if(!object)return new Response('Không tìm thấy',{status:404});
    return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});
  }catch{return new Response('Không thể tải ảnh',{status:503});}
}
