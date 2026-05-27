import os
import sys

# Ensure perfetto can be imported
try:
    from perfetto.trace_processor import TraceProcessor
except ImportError:
    print("\n\x1b[31mError: Google 'perfetto' Python library is not installed.\x1b[0m")
    print("Please install it first by running:")
    print("  \x1b[36mpip install perfetto\x1b[0m\n")
    sys.exit(1)

# Path to the trace file
trace_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../chrome_example_wikipedia.perfetto_trace"))
report_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../trace-analysis-report.txt"))

if not os.path.exists(trace_path):
    print(f"\n\x1b[31mError: Wikipedia trace file not found at: {trace_path}\x1b[0m\n")
    sys.exit(1)

print("\n\x1b[35m====================================================\x1b[0m")
print("\x1b[1m⚡ GOOGLE PERFETTO TRACE PROCESSOR - WIKIPEDIA ANALYSIS ⚡\x1b[0m")
print("\x1b[35m====================================================\x1b[0m")
print(f"Loading trace: {os.path.basename(trace_path)} ...")

try:
    # Initialize the Trace Processor
    tp = TraceProcessor(file_path=trace_path)
    print("\x1b[32m✓ Trace Processor loaded successfully!\x1b[0m\n")
except Exception as e:
    print(f"\x1b[31mFailed to load trace: {e}\x1b[0m")
    sys.exit(1)

# List of queries to run and report on
reports = []

# Report 1: Top 5 Slices by Duration (Raw - similar to user query)
q_raw = """
SELECT name, dur/1e6 as dur_ms 
FROM slice 
ORDER BY dur DESC 
LIMIT 5;
"""

# Report 2: Top 10 Active (Non-Idle) Slices by Duration
q_active = """
SELECT name, category, dur/1e6 as dur_ms 
FROM slice 
WHERE name NOT LIKE '%Idle%' 
  AND name NOT LIKE '%RAILMode%' 
  AND name NOT LIKE '%CompositorPriority%'
  AND name NOT LIKE '%ThreadController%'
ORDER BY dur DESC 
LIMIT 10;
"""

# Report 3: V8 Engine & JavaScript Compilation / Execution Slices
q_v8 = """
SELECT name, COUNT(*) as count, SUM(dur)/1e6 as total_dur_ms, AVG(dur)/1e6 as avg_dur_ms
FROM slice 
WHERE name LIKE '%V8%' 
   OR name LIKE '%FunctionCall%' 
   OR name LIKE '%EvaluateScript%' 
   OR name LIKE '%Compile%'
GROUP BY name
ORDER BY total_dur_ms DESC
LIMIT 8;
"""

# Report 4: Rendering & Layout Engine Slices
q_render = """
SELECT name, COUNT(*) as count, SUM(dur)/1e6 as total_dur_ms
FROM slice 
WHERE name LIKE '%Layout%' 
   OR name LIKE '%Paint%' 
   OR name LIKE '%Composite%' 
   OR name LIKE '%UpdateLayer%'
GROUP BY name
ORDER BY total_dur_ms DESC
LIMIT 8;
"""

def format_section(title, rows, headers):
    section = []
    section.append(f"\n## 📊 {title}")
    section.append("=" * 60)
    
    # Calculate column widths
    widths = [len(h) for h in headers]
    for r in rows:
        for idx, val in enumerate(r):
            # Convert values to string for length checking
            s_val = f"{val:.3f}" if isinstance(val, float) else str(val)
            widths[idx] = max(widths[idx], len(s_val))
            
    # Format header
    header_line = " | ".join(h.upper().ljust(widths[idx]) for idx, h in enumerate(headers))
    separator = "-+-".join("-" * w for w in widths)
    section.append(header_line)
    section.append(separator)
    
    # Format rows
    for r in rows:
        row_cells = []
        for idx, val in enumerate(r):
            if isinstance(val, float):
                s_val = f"{val:.3f} ms" if "dur" in headers[idx] else f"{val:.3f}"
            else:
                s_val = str(val)
            row_cells.append(s_val.ljust(widths[idx]))
        section.append(" | ".join(row_cells))
    return "\n".join(section)

# Executing Query 1
print("Analyzing Raw Top Slices...")
res_raw = tp.query(q_raw)
raw_rows = [(row.name, row.dur_ms) for row in res_raw]
rep_raw = format_section("Raw Top 5 Slices (Including Idle)", raw_rows, ["name", "dur_ms"])
print(rep_raw)
reports.append(rep_raw)

# Executing Query 2
print("\nAnalyzing Active CPU Slices...")
res_active = tp.query(q_active)
active_rows = [(row.name, row.category or "N/A", row.dur_ms) for row in res_active]
rep_active = format_section("Top 10 Active CPU Slices (Excluding Idle)", active_rows, ["name", "category", "dur_ms"])
print(rep_active)
reports.append(rep_active)

# Executing Query 3
print("\nAnalyzing JavaScript & V8 Slices...")
res_v8 = tp.query(q_v8)
v8_rows = [(row.name, row.count, row.total_dur_ms, row.avg_dur_ms) for row in res_v8]
rep_v8 = format_section("V8 JavaScript Engine & Compile Actions", v8_rows, ["name", "count", "total_dur_ms", "avg_dur_ms"])
print(rep_v8)
reports.append(rep_v8)

# Executing Query 4
print("\nAnalyzing Browser Render & Paint Slices...")
res_render = tp.query(q_render)
render_rows = [(row.name, row.count, row.total_dur_ms) for row in res_render]
rep_render = format_section("Browser Paint, Layout & Composite Actions", render_rows, ["name", "count", "total_dur_ms"])
print(rep_render)
reports.append(rep_render)

# Write full report to Desktop
try:
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Google Perfetto Wikipedia Performance Audit Report\n")
        f.write(f"Analyzed Trace: {trace_path}\n")
        f.write(f"File Size: {os.path.getsize(trace_path) / 1e6:.2f} MB\n")
        f.write("\n".join(reports))
    print(f"\n\x1b[32m✓ Full report saved to Desktop at: {report_path}\x1b[0m\n")
except Exception as e:
    print(f"\x1b[31mFailed to save report to Desktop: {e}\x1b[0m")
