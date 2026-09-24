const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('mibox',{
  listSources:()=>ipcRenderer.invoke('sources:list'),
  loadSource:(id,refresh=false)=>ipcRenderer.invoke('source:load',id,refresh),
  testStream:url=>ipcRenderer.invoke('stream:test',url),
  openVideo:()=>ipcRenderer.invoke('file:video'),
  openPlaylist:()=>ipcRenderer.invoke('file:playlist'),
  fullscreen:value=>ipcRenderer.invoke('window:fullscreen',value)
});
