import './App.css'
import { useState } from 'react';
import { Schedule } from './models/ecs/Schedule';
import { convertEcsToClassIsland } from './converting';
import { loadEcsSchedule } from './utils/scheduleLoader';
import { AppBar, Toolbar, IconButton, Typography, Button, MenuItem, Select, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper } from '@mui/material';
import { saveClassIslandProfile } from './utils/classIslandLoader';

const convertingOptions = ["ClassIsland", "ElectronClassSchedule"]

function App() {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false); 
  const [dialogHeader, setdialogHeader] = useState<string>(""); 
  const [dialogContent, setdialogContent] = useState<string>(""); 
  const [configRaw, setConfigRaw] = useState<string>("");
  const [configTarget, setConfigTarget] = useState<string>("");
  const [configTargetFileName, setConfigTargetFileName] = useState<string>("");
  const [isConverted, setIsConverted] = useState<boolean>(false);
  const [sourceFormat, setSourceFormat] = useState<string | undefined>("");
  const [targetFormat, setTargetFormat] = useState<string | undefined>("");
  const [targetUrl, setTargetUrl] = useState<string>("");

  const targetPanelContent = isConverted ?
    <>
      <Paper className='app-stretched app-container' variant="outlined">
        <p>转换完成！</p>
        <Button variant="contained" 
          download={configTargetFileName}
          href={targetUrl}>
          下载
        </Button>
      </Paper>
    </> :
    <>
      <p id="idle-tip">转换后的结果会出现在此处。</p>
    </>

  return (
    <>
      <div id="app-container-main">
        <input
          accept="text/javascript"
          id="contained-button-file"
          multiple
          type="file"
          className='hidden'
          onChange={fileSelected}
        />
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6">
              课表转换工具
            </Typography>
          </Toolbar>
        </AppBar>
        <div id="app-main-container">
          <div id="app-main">
            <div id="app-source-panel" className='app-shcedule-panel'>
            <label htmlFor="contained-button-file">
              <Button variant="contained" color="primary" component="span">
                上传
              </Button>
            </label>
            </div>
            <div id="app-target-panel" className='app-shcedule-panel'>
              {targetPanelContent}
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{dialogHeader}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogContent}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )

  function handleClose () {
    setDialogOpen(false);
  }

  function showDialog(title:string, content:string) {
    setdialogHeader(title);
    setdialogContent(content);
    setDialogOpen(true);
  }
  
  function fileSelected() {
    const input = document.getElementById("contained-button-file") as HTMLInputElement;
    const files = input.files?.item(0);
    if (files == null) {
      return;
    }
    input.value = "";
    console.log("选择文件", files);
    if (!files.name.endsWith(".js")) {
      showDialog("无法加载文件", "请选择正确格式的文件。");
    }
    const reader = new FileReader();
    reader.onload = () => {
      console.log(reader.result);
      setConfigRaw(reader.result as string);
      loadConfig(reader.result + "\nreturn scheduleConfig;");
    };
    reader.readAsText(files);
  }

  function loadConfig(js: string) {
    const r = loadEcsSchedule(js);
    const ci = convertEcsToClassIsland(r);
    console.log(ci);
    setIsConverted(true);
    const saveUrl = URL.createObjectURL(new Blob(
      [ saveClassIslandProfile(ci) ], { type: "application/json" }
    ));
    setConfigTargetFileName("Profile.json");
    setTargetUrl(saveUrl);
    console.log("下载链接：", saveUrl);
  }
}


export default App
