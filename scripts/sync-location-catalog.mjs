import {readFile,writeFile} from 'node:fs/promises';
const directory=JSON.parse(await readFile('public/data/vietnam-administrative-latest.json','utf8'));
const aliases=JSON.parse(await readFile('public/data/vietnam-ward-aliases.json','utf8'));
const [provinces,wards]=await Promise.all(['provinces','wards'].map(async name=>{
  const response=await fetch(`https://www.tinhthanhpho.com/data/${name}.json`,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Catalog unavailable');return response.json();
}));
if(provinces.data.length!==34||wards.data.length!==3321)throw new Error('Administrative coverage changed; review before updating.');
let changedProvinces=0,changedWards=0;
const slug=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,'_');
for(const province of directory){
  const source=provinces.data.find(item=>Number(item.code)===province.code);
  if(!source)throw new Error('Missing province');
  const name=source.name_with_type||`${source.type} ${source.name}`;
  if(!/^(Tỉnh|Thành phố)\s/.test(name))throw new Error('Invalid province classification');
  if(name!==province.name){province.name=name;province.division_type=source.type.toLowerCase();changedProvinces++;}
  for(const ward of province.wards){
    const source=wards.data.find(item=>Number(item.code)===ward.code&&Number(item.province_code)===province.code);
    if(!source)throw new Error('Missing ward');
    const name=source.name_with_type||`${source.type} ${source.name}`;
    if(!/^(Phường|Xã|Đặc khu)\s/.test(name))throw new Error('Invalid ward classification');
    if(name!==ward.name){
      if(!aliases.aliases.some(item=>item.provinceCode===province.code&&item.name===ward.name&&item.targets.includes(ward.code)))aliases.aliases.push({provinceCode:province.code,name:ward.name,district:'',targets:[ward.code],full:true,kind:'reclassification'});
      ward.name=name;ward.division_type=source.type.toLowerCase();ward.codename=slug(name);changedWards++;
    }
  }
}
await writeFile('public/data/vietnam-administrative-latest.json',JSON.stringify(directory,null,2)+'\n');
await writeFile('public/data/vietnam-ward-aliases.json',JSON.stringify(aliases)+'\n');
console.log({changedProvinces,changedWards,version:wards.metadata.data_version});
