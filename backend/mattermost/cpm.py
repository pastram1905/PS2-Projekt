from datetime import datetime, timedelta
from collections import defaultdict, deque

def parse_date(date_str):
    return datetime.strptime(date_str, "%Y-%m-%d")

def calculate_duration(start, end):
    return (parse_date(end) - parse_date(start)).days

def calculate_critical_path(data):
    tasks = {}
    graph = defaultdict(list)
    reverse_graph = defaultdict(list)
    indegree = defaultdict(int)
    
    for board in data:
        for task in board["tasks"]:
            tid = task["id"]
            dur = calculate_duration(task["Start_Date"], task["End_Date"])
            start_dt = parse_date(task["Start_Date"])
            end_dt = parse_date(task["End_Date"])

            tasks[tid] = {
                "id": tid,
                "title": task["title"],
                "duration": dur,
                "start_date": start_dt,
                "end_date": end_dt,
                "depends_on": task.get("Depends_on", []),
                "early_start": 0,
                "early_finish": 0,
                "late_start": float('inf'),
                "late_finish": float('inf')
            }

            for dep in task.get("Depends_on", []):
                if dep and dep != "None":
                    graph[dep].append(tid)
                    reverse_graph[tid].append(dep)
                    indegree[tid] += 1
    
    queue = deque([tid for tid in tasks if indegree[tid] == 0])
    top_order = []

    while queue:
        current = queue.popleft()
        top_order.append(current)
        for neighbor in graph[current]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    
    for tid in top_order:
        t = tasks[tid]
        if not reverse_graph[tid]:
            t["early_start"] = 0
        else:
            t["early_start"] = max(tasks[dep]["early_finish"] for dep in reverse_graph[tid])
        t["early_finish"] = t["early_start"] + t["duration"]
    
    project_duration = max(t["early_finish"] for t in tasks.values())

    for tid in reversed(top_order):
        t = tasks[tid]
        if not graph[tid]:
            t["late_finish"] = project_duration
        else:
            t["late_finish"] = min(tasks[succ]["late_start"] for succ in graph[tid])
        t["late_start"] = t["late_finish"] - t["duration"]
    
    project_start_date = min(t["start_date"] for t in tasks.values())

    for t in tasks.values():
        t["early_start_date"] = project_start_date + timedelta(days=t["early_start"])
        t["early_finish_date"] = project_start_date + timedelta(days=t["early_finish"])
        t["late_start_date"] = project_start_date + timedelta(days=t["late_start"])
        t["late_finish_date"] = project_start_date + timedelta(days=t["late_finish"])
    
    critical_tasks = {t["id"] for t in tasks.values() if t["early_start"] == t["late_start"]}

    return tasks, graph, critical_tasks
