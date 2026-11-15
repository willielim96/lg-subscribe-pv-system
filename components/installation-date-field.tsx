export function InstallationDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div>
    <label>安装日期 · 留空为 Waiting List
      <input type="date" value={value} onChange={event => onChange(event.target.value)} />
    </label>
    {value && <button type="button" className="secondary" onClick={() => onChange('')}>清除日期</button>}
  </div>;
}
