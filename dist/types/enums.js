"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Priority = exports.TaskStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["admin"] = "admin";
    Role["staff"] = "staff";
})(Role || (exports.Role = Role = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["todo"] = "todo";
    TaskStatus["in_process"] = "in-process";
    TaskStatus["review"] = "review";
    TaskStatus["completed"] = "completed";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var Priority;
(function (Priority) {
    Priority["low"] = "low";
    Priority["medium"] = "medium";
    Priority["high"] = "high";
})(Priority || (exports.Priority = Priority = {}));
