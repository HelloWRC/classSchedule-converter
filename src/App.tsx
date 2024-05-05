import './App.css'
import { useState } from 'react';
import { convertEcsToClassIsland } from './converting';
import { loadEcsSchedule } from './utils/scheduleLoader';
import { AppBar, Toolbar, Typography, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Select, MenuItem, InputLabel, FormControl, Alert, useMediaQuery } from '@mui/material';
import { saveClassIslandProfile } from './utils/classIslandLoader';
import TextField from '@material-ui/core/TextField';
import React from 'react';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';

const convertingOptions = ["ClassIsland", "ElectronClassSchedule"]

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light'
        }
      }),
    [prefersDarkMode],
  );


  const [dialogOpen, setDialogOpen] = useState<boolean>(false); 
  const [dialogHeader, setdialogHeader] = useState<string>(""); 
  const [dialogContent, setdialogContent] = useState<string>(""); 
  const [configRaw, setConfigRaw] = useState<string>("");
  // const [configTarget, setConfigTarget] = useState<string>("");
  const [configTargetFileName, setConfigTargetFileName] = useState<string>("");
  const [isConverted, setIsConverted] = useState<boolean>(false);
  const [sourceFormat, setSourceFormat] = useState<string | undefined>("ElectronClassSchedule");
  const [targetFormat, setTargetFormat] = useState<string | undefined>("ClassIsland");
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);
  const [convertingError, setConvertingError] = useState<Error | undefined>();

  const targetPanelContent = isConverted ?
    <>
      <Alert severity="success">转换成功！</Alert>
      <div>
        <TextField label="文件名" variant="filled"
                  value={configTargetFileName}
                  onChange={(e) => {
                    setConfigTargetFileName(e.target.value);
                  }}/>
      </div>
      <div>
        <Button variant="contained" 
          download={configTargetFileName}
          href={targetUrl}>
          下载
        </Button>
      </div>
    </> :
    <>
      <p id="idle-tip">转换后的结果会出现在此处。</p>
    </>

  return (
    <>
    <ThemeProvider theme={theme}>
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
            <Typography variant="h6" id="app-title">
              课表转换工具
            </Typography>
            <Toolbar>
              <Button color="inherit"
              href="https://github.com/HelloWRC/classSchedule-converter">
                GitHub
              </Button>
            </Toolbar>
          </Toolbar>
        </AppBar>
        <div id="app-main-container">
          <div id="app-main">
            <div id="app-source-panel" className='app-shcedule-panel'>
              <Paper className='app-container' variant="outlined">
                <strong>源文件</strong>
                <FormControl id="form-source-format" className='form' disabled>
                  <InputLabel id="label-source-format">源格式</InputLabel>
                  <Select
                    labelId="demo-simple-select-filled-label"
                    id="label-source-format"
                    variant='filled'
                    label="源格式"
                    value={sourceFormat}
                    onChange={(e) => {
                      setSourceFormat(e.target.value);
                    }}
                  >
                    {convertingOptions.map((v) => <MenuItem value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
                <label htmlFor="contained-button-file">
                  <Button variant="contained" color="primary" component="span">
                    上传
                  </Button>
                </label>
                {
                  isConfigLoaded?
                  <>
                    <div>
                      <Alert severity='success'>上传成功！</Alert>
                    </div>
                    <div>
                      <Button onClick={startConvert} variant='contained'>开始转换</Button>
                      <Button onClick={() => {
                        setConfigRaw("");
                        setIsConfigLoaded(false);
                      }} variant='outlined'>清空</Button>
                    </div>
                  </>
                  :
                    <></>
                }
              </Paper>
            </div>
            <div id="app-target-panel" className='app-shcedule-panel'>
              <Paper className='app-container' variant="outlined">
                <strong>目标文件</strong>
                <FormControl id="form-target-format" className='form' disabled>
                  <InputLabel id="label-target-format">目标格式</InputLabel>
                  <Select
                    variant='filled'
                    labelId="demo-simple-select-filled-label"
                    id="label-target-format"
                    label="目标格式"
                    value={targetFormat}
                    onChange={(e) => {
                      setTargetFormat(e.target.value);
                    }}
                  >
                    {convertingOptions.map((v) => <MenuItem value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
                {convertingError != undefined ? <>
                  <div>
                    <Alert severity='error'>
                      转换失败，请检查配置文件格式是否正确：{convertingError.message}<br/>
                      {convertingError.stack}</Alert>
                  </div>
                  </>
                  :
                  <></>}
                {targetPanelContent}
              </Paper>
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
    </ThemeProvider>
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
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      console.log(reader.result);
      setConfigRaw(reader.result as string);
      setIsConfigLoaded(true);
    };
    reader.readAsText(files);
  }
  
  function startConvert() {
    try {
      const r = loadEcsSchedule(configRaw);
      const ci = convertEcsToClassIsland(r);
      setConvertingError(undefined);
      console.log(ci);
      setIsConverted(true);
      const saveUrl = URL.createObjectURL(new Blob(
        [ saveClassIslandProfile(ci) ], { type: "application/json" }
      ));
      setConfigTargetFileName("Profile.json");
      setTargetUrl(saveUrl);
      console.log("下载链接：", saveUrl);
    } catch (error) {
      setConvertingError(error as Error);
      setIsConverted(false);
    }
  }
}


export default App
