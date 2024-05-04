import { Schedule } from "./models/ecs/Schedule";
import { Subject } from "./models/classisland/Subject";
import { TimeLayout } from "./models/classisland/TimeLayout";
import { TimeLayoutItem } from "./models/classisland/TimeLayoutItem";
import { Profile } from "./models/classisland/Profile";
import { ClassPlan } from "./models/classisland/ClassPlan";

interface TimeSpan {
    start: Date;
    end: Date;
}

/// Generate GUID
function generateGuid(): string {
    const pattern = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    return pattern.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = (c === "x") ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}



function matchTimeSpan(s: string): TimeSpan {
    const regex = /\d+/gi;
    const nums = s.match(regex);
    if (nums == null || nums.length != 4){
        throw new Error("无效的时间格式：" + s);
    }
    const start = new Date();
    start.setHours(+nums[0]);
    start.setMinutes(+nums[1]);
    start.setSeconds(0);
    start.setMilliseconds(0);
    const end = new Date();
    end.setHours(+nums[1]);
    end.setMinutes(+nums[2]);
    end.setSeconds(0);
    end.setMilliseconds(0);
    return {
        start: start,
        end: end
    }
}

export function convertEcsToClassIsland(profile: Schedule): Profile {
    const classIsland = new Profile();
    const subjectMapping = new Map<string, string>();
    const timeTableMapping = new Map<string, string>();
    const timeTableMappingReversed = new Map<string, string>();
    // 处理科目
    profile.subject_name.forEach((v, k) => {
        const guid = generateGuid();
        subjectMapping.set(guid, k);
        classIsland.Subjects.set(guid, {
            Name: v,
            Initial: k,
            TeacherName: "",
            IsOutDoor: false
        });
    })
    // 处理时间表
    profile.timetable.forEach((v, k) => {
        const guid = generateGuid();
        timeTableMapping.set(guid, k);
        timeTableMappingReversed.set(k, guid);
        const tl = new TimeLayout();
        if (v.size <= 0) {
            return;
        } 
        let last: TimeLayoutItem | undefined;
        const dividers = profile.divider.get(k);
        v.forEach((v, k) => {
            const tp = new TimeLayoutItem();
            const ts = matchTimeSpan(k);
            tp.StartSecond = ts.start;
            tp.EndSecond = ts.end;
            if (last != undefined) {
                last.EndSecond = tp.StartSecond;
            }
            if (typeof(v) == "string") {
                tp.TimeType = 1;
            } 
            last = tp
            tl.Layouts.push(tp);
            if (typeof(v) == "number" && dividers != undefined && dividers.includes(v as number)) {
                const startDivider = new Date(ts.end.getUTCSeconds() + 120);
                const tpd = new TimeLayoutItem();
                tpd.StartSecond = tpd.EndSecond = startDivider;
                tpd.TimeType = 2;
                tl.Layouts.push(tpd)
            }
        });
        tl.Layouts.sort((x, y) => {
            return x.StartSecond.getUTCSeconds() - y.EndSecond.getUTCSeconds();
        })
        classIsland.TimeLayouts.set(guid, tl);
    })

    //处理课表
    profile.daily_class.forEach((v, i) => {
        const cp1 = new ClassPlan();  // 单周
        const cp2 = new ClassPlan();  // 双周
        let isCp2Set = false;  // 是否使用双周课表？
        const timeTable = v.timetable;
        console.log(timeTable, v);

        const timeLayoutId = timeTableMappingReversed.get(v.timetable);
        if (timeLayoutId == undefined)
            return;
        cp1.Name = cp2.Name = v.Chinese + v.English;
        cp1.TimeRule.WeekDay = cp2.TimeRule.WeekDay = i;
        cp1.TimeLayoutId = cp2.TimeLayoutId = timeLayoutId;
        v.classList.forEach((v) => {
            if (typeof(v) == "string") {
                const subjectId = subjectMapping.get(v);
                cp1.Classes.push({
                    ClassId: subjectId == undefined ? "" : subjectId
                });
                cp2.Classes.push({
                    ClassId: subjectId == undefined ? "" : subjectId
                });
                
            } else {
                isCp2Set = true;
                const subjectId1 = subjectMapping.get(v[0]);
                const subjectId2 = v.length >= 1 ? subjectMapping.get(v[1]) : undefined;
                cp1.Classes.push({
                    ClassId: subjectId1 == undefined ? "" : subjectId1
                });
                cp2.Classes.push({
                    ClassId: subjectId2 == undefined ? "" : subjectId2
                });
            }
        });
        if (isCp2Set) {
            cp1.TimeRule.WeekCountDiv = 1;
            cp1.Name += " 单";
            cp2.TimeRule.WeekCountDiv = 2;
            cp2.Name += " 双";
            classIsland.ClassPlans.set(generateGuid(), cp1);
            classIsland.ClassPlans.set(generateGuid(), cp2);
        } else {
            // 如果双周课表没有被使用，那么就认为这天没有轮换课程。
            classIsland.ClassPlans.set(generateGuid(), cp1);
        }
    })
    
    return classIsland;
}