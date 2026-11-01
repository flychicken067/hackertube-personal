export function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    ['j / k', '下一个 / 上一个视频'],
    ['Enter', '打开选中视频'],
    ['l', '点赞或取消点赞'],
    ['w', '加入或移出稍后看'],
    ['/', '聚焦搜索框'],
    ['?', '显示这张帮助'],
  ];
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="shortcut-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-head">
          <h2 id="shortcut-title">键盘快捷键</h2>
          <button type="button" onClick={onClose} aria-label="关闭快捷键帮助">
            关闭
          </button>
        </div>
        <dl>{shortcuts.map(([key, label]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{label}</dd></div>)}</dl>
      </section>
    </div>
  );
}
