const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const fs = require('fs/promises');
const path = require('path');
const {pathToFileURL} = require('url');
const http = require('http');
const https = require('https');

const sources = {
  zho:['中文','languages_zho.m3u','https://iptv-org.github.io/iptv/languages/zho.m3u'],
  eng:['English','languages_eng.m3u','https://iptv-org.github.io/iptv/languages/eng.m3u'],
  yue:['粤语','languages_yue.m3u','https://iptv-org.github.io/iptv/languages/yue.m3u'],
  jpn:['日本語','languages_jpn.m3u','https://iptv-org.github.io/iptv/languages/jpn.m3u'],
  kor:['한국어','languages_kor.m3u','https://iptv-org.github.io/iptv/languages/kor.m3u'],
  fra:['Français','languages_fra.m3u','https://iptv-org.github.io/iptv/languages/fra.m3u'],
  spa:['Español','languages_spa.m3u','https://iptv-org.github.io/iptv/languages/spa.m3u'],
  deu:['Deutsch','languages_deu.m3u','https://iptv-org.github.io/iptv/languages/deu.m3u'],
  ara:['العربية','languages_ara.m3u','https://iptv-org.github.io/iptv/languages/ara.m3u'],
  kids:['少儿','categories_kids.m3u','https://iptv-org.github.io/iptv/categories/kids.m3u'],
  documentary:['纪录片','categories_documentary.m3u','https://iptv-org.github.io/iptv/categories/documentary.m3u'],
  music:['音乐','categories_music.m3u','https://iptv-org.github.io/iptv/categories/music.m3u'],
  free:['全球 Free TV','github_free_tv.m3u','https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8'],
  public:['公共广播台','github_public_broadcasters.m3u','https://raw.githubusercontent.com/freecasthub/public-iptv/main/playlist.m3u']
  ,dongyubin:['东云 IPTV（GitHub）','dongyubin_github.m3u',null]
};

const dongyubinFeeds = [
  ['zbefine', 'https://raw.githubusercontent.com/zbefine/iptv/main/iptv.m3u'],
  ['Vamoschuck', 'https://raw.githubusercontent.com/vamoschuck/TV/main/M3U'],
  ['YueChan', 'https://testingcf.jsdelivr.net/gh/YueChan/Live@main/IPTV.m3u'],
  ['BigBigGrandG', 'https://raw.githubusercontent.com/BigBigGrandG/IPTV-URL/release/Gather.m3u'],
  ['Kimentanm', 'https://raw.githubusercontent.com/Kimentanm/aptv/master/m3u/iptv.m3u'],
  ['YanG-1989', 'https://raw.githubusercontent.com/YanG-1989/m3u/main/Gather.m3u'],
  ['EPG.PW', 'https://epg.pw/test_channels.m3u'],
  ['香港频道', 'https://epg.pw/test_channels_hong_kong.m3u'],
  ['台湾频道', 'https://epg.pw/test_channels_taiwan.m3u'],
  ['新加坡频道', 'https://epg.pw/test_channels_singapore.m3u'],
  ['马来西亚频道', 'https://epg.pw/test_channels_malaysia.m3u']
];

function mergeDongyubin(texts){
  const seen=new Set(),out=['#EXTM3U'];
  for(const text of texts){
    const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/);
    for(let i=0;i<lines.length;i++){
      if(!lines[i].startsWith('#EXTINF:'))continue;
      const url=(lines[i+1]||'').trim();
      if(!/^https?:\/\//i.test(url)||seen.has(url))continue;
      seen.add(url);out.push(lines[i],url);
    }
  }
  return `${out.join('\n')}\n`;
}

function createWindow(){
  const win = new BrowserWindow({width:1600,height:900,minWidth:1080,minHeight:650,backgroundColor:'#07111f',autoHideMenuBar:true,show:false,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,webSecurity:false,allowRunningInsecureContent:true}});
  win.loadFile('index.html');
  win.once('ready-to-show',()=>{win.show();win.focus();});
}

async function fetchText(url){
  const response=await fetch(url,{headers:{'User-Agent':'MiBoxOS-Windows/1.0'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function probe(url,redirects=0){return new Promise(resolve=>{
  if(!/^https?:\/\//i.test(url)||redirects>3)return resolve(false);
  let settled=false;const done=value=>{if(settled)return;settled=true;resolve(value)};
  try{const client=url.startsWith('https:')?https:http;const req=client.get(url,{headers:{'User-Agent':'MiBoxOS-Windows/1.0','Range':'bytes=0-1023'},timeout:5000},res=>{
    if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){req.destroy();return probe(new URL(res.headers.location,url).href,redirects+1).then(done)}
    if(res.statusCode<200||res.statusCode>=400){res.resume();return done(false)}
    res.once('data',()=>{req.destroy();done(true)});res.once('end',()=>done(true));
  });req.on('timeout',()=>{req.destroy();done(false)});req.on('error',()=>done(false));}catch(e){done(false)}
});}

app.whenReady().then(()=>{
  ipcMain.handle('sources:list',()=>Object.entries(sources).map(([id,v])=>({id,name:v[0]})));
  ipcMain.handle('source:load',async(_e,id,refresh)=>{
    const source=sources[id];if(!source)throw new Error('未知频道分类');
    const cache=path.join(app.getPath('userData'),`${id}.m3u`);
    if(id==='dongyubin'){
      if(refresh){
        const texts=await Promise.all(dongyubinFeeds.map(async([,url])=>{try{return await fetchText(url)}catch{return ''}}));
        const merged=mergeDongyubin(texts);await fs.writeFile(cache,merged,'utf8');return merged;
      }
      try{return await fs.readFile(cache,'utf8')}catch{}
      return fs.readFile(path.join(__dirname,'playlists',source[1]),'utf8');
    }
    if(refresh){const text=await fetchText(source[2]);await fs.writeFile(cache,text,'utf8');return text}
    try{return await fs.readFile(cache,'utf8')}catch{}
    return fs.readFile(path.join(__dirname,'playlists',source[1]),'utf8');
  });
  ipcMain.handle('stream:test',(_e,url)=>probe(url));
  ipcMain.handle('file:video',async()=>{const r=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'视频文件',extensions:['mp4','mkv','webm','mov','m4v','ts','m3u8']},{name:'所有文件',extensions:['*']} ]});return r.canceled?null:pathToFileURL(r.filePaths[0]).href});
  ipcMain.handle('file:playlist',async()=>{const r=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'M3U 播放列表',extensions:['m3u','m3u8']}]});if(r.canceled)return null;return {name:path.basename(r.filePaths[0]),text:await fs.readFile(r.filePaths[0],'utf8')}});
  ipcMain.handle('window:fullscreen',(e,value)=>{BrowserWindow.fromWebContents(e.sender)?.setFullScreen(value);return value});
  createWindow();
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
