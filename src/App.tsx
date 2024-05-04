import { Button, Card, Combobox, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger, Option } from '@fluentui/react-components'
import './App.css'
import { useState } from 'react';
import { Schedule } from './models/ecs/Schedule';
import { convertEcsToClassIsland } from './converting';
import { loadEcsSchedul } from './utils/scheduleLoader';


function App() {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false); 
  const [dialogHeader, setdialogHeader] = useState<string>(""); 
  const [dialogContent, setdialogContent] = useState<string>(""); 
  const [configRaw, setConfigRaw] = useState<string>("");


  return (
    <>
      <div id="app-container-main">
        <div id="app-appbar-container">
          <div id="app-appbar">
            <p>ClassSchedule Converter</p>
          </div>

        </div>
        <div id="app-main">
          <Card>
            <h2>课表格式转换工具</h2>
            <div id="app-translation-direction">
              <p>
                ElectronClassSchedule ➡ ClassIsland
              </p>
            </div>
            <Button onClick={uploadFile}>上传文件</Button>
            <input type="file" id="file-import-internal" onChange={fileSelected}/>
          </Card>
        </div>

        
      </div>
      <Dialog open={dialogOpen}
              onOpenChange={(event, data) => {
                // it is the users responsibility to react accordingly to the open state change
                setDialogOpen(data.open);
              }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{dialogHeader}</DialogTitle>
            <DialogContent>
              {dialogContent}
            </DialogContent>
            <DialogActions>
            <DialogTrigger disableButtonEnhancement>    
              <Button appearance="primary">确定</Button>
            </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  )

  function onDialogOpenChanged() {
    
  }

  function uploadFile() {
    const input = document.getElementById("file-import-internal") as HTMLInputElement;
    if (input == null)
      return;
    input.value = "";
    input.click();
  }

  function showDialog(title:string, content:string) {
    setdialogHeader(title);
    setdialogContent(content);
    setDialogOpen(true);
  }
  
  function fileSelected() {
    const input = document.getElementById("file-import-internal") as HTMLInputElement;
    const files = input.files?.item(0);
    if (files == null) {
      return;
    }
    console.log("选择文件", files);
    if (!files.name.endsWith(".js")) {
      showDialog("无法加载文件", "请选择正确格式的文件。");
    }
    const reader = new FileReader();
    reader.onload = () => {
      console.log(reader.result);
      setConfigRaw(reader.result as string);
      loadConfig(configRaw + "\nreturn scheduleConfig;");
    };
    reader.readAsText(files);
  }

  function loadConfig(js: string) {
    const r = loadEcsSchedul(js);
    const ci = convertEcsToClassIsland(r);
    console.log(ci);
  }
}


export default App
