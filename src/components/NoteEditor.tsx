import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Bold,
  Check,
  ChevronDown,
  Code2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Undo2,
  Underline,
} from 'lucide-react';

const EMPTY_HTML = '<p><br></p>';
type BlockFormat = 'p' | 'h2' | 'h3' | 'blockquote' | 'pre';

const blockFormatOptions: Array<{ value: BlockFormat; label: string; hint: string }> = [
  { value: 'p', label: '正文', hint: '普通段落' },
  { value: 'h2', label: '标题', hint: '一级层级' },
  { value: 'h3', label: '小标题', hint: '二级层级' },
  { value: 'blockquote', label: '引用', hint: '摘录与思考' },
  { value: 'pre', label: '代码块', hint: '等宽文本' },
];

function getBlockFormatLabel(format: BlockFormat) {
  return blockFormatOptions.find((option) => option.value === format)?.label ?? '正文';
}

function isEditorVisuallyEmpty(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  if (template.content.querySelector('img, figure, pre, blockquote, ul, ol, h1, h2, h3, h4, hr')) return false;
  return !(template.content.textContent ?? '').replace(/\s+/g, '').trim();
}
const allowedTags = new Set([
  'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4',
  'figure', 'figcaption', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong', 'u', 'ul',
]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value: string) {
  const raw = value.trim();
  if (!raw) return '';
  const candidate = /^(?:https?:|mailto:)/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate, window.location.href);
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') return url.href;
  } catch {
    // Ignore malformed links pasted from another application.
  }
  return '';
}

function safeImageUrl(value: string) {
  if (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value)) return value;
  const url = safeUrl(value);
  return /^https?:/i.test(url) ? url : '';
}

export function sanitizeNoteHtml(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;

  Array.from(template.content.querySelectorAll('*')).forEach((element) => {
    const tag = element.tagName.toLowerCase();
    if (!allowedTags.has(tag)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const keep = (tag === 'a' && name === 'href')
        || (tag === 'img' && ['src', 'alt', 'width', 'height'].includes(name));
      if (!keep) element.removeAttribute(attribute.name);
    });

    if (tag === 'a') {
      const href = safeUrl(element.getAttribute('href') ?? '');
      if (href) {
        element.setAttribute('href', href);
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noreferrer noopener');
      } else {
        element.replaceWith(...Array.from(element.childNodes));
      }
    }

    if (tag === 'img') {
      const src = safeImageUrl(element.getAttribute('src') ?? '');
      if (src) {
        element.setAttribute('src', src);
        element.setAttribute('loading', 'lazy');
        element.removeAttribute('width');
        element.removeAttribute('height');
      } else {
        element.remove();
      }
    }
  });

  return template.innerHTML.trim() || EMPTY_HTML;
}

export function noteContentToHtml(content: string) {
  if (!content.trim()) return EMPTY_HTML;
  if (/<[a-z][\s\S]*>/i.test(content)) return sanitizeNoteHtml(content);
  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function noteTextPreview(content: string) {
  if (!content) return '';
  const template = document.createElement('template');
  template.innerHTML = noteContentToHtml(content);
  return (template.content.textContent ?? '').replace(/\s+/g, ' ').trim();
}

async function imageFileToDataUrl(file: File) {
  if (!file.type.startsWith('image/')) return '';
  if (file.type === 'image/gif' || file.size <= 800 * 1024) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error ?? new Error('image-read-failed'));
      reader.readAsDataURL(file);
    });
  }

  const bitmap = await createImageBitmap(file);
  const maxSize = 1800;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', .84);
}

function findEditableBlock(editor: HTMLElement, node: Node | null) {
  let element = node instanceof HTMLElement ? node : node?.parentElement;
  while (element && element !== editor) {
    const tag = element.tagName.toLowerCase();
    if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre'].includes(tag)) return element;
    element = element.parentElement;
  }
  return null;
}

function getTextOffset(root: HTMLElement, node: Node, offset: number) {
  if (node !== root && !root.contains(node)) return 0;
  const range = document.createRange();
  range.selectNodeContents(root);
  try {
    range.setEnd(node, offset);
    return range.toString().length;
  } catch {
    return 0;
  }
}

function getTextPoint(root: HTMLElement, requestedOffset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = Math.max(0, requestedOffset);
  let lastText: Text | null = null;
  while (walker.nextNode()) {
    const text = walker.currentNode as Text;
    lastText = text;
    if (remaining <= text.data.length) return { node: text, offset: remaining };
    remaining -= text.data.length;
  }
  if (lastText) return { node: lastText, offset: lastText.data.length };
  const text = document.createTextNode('');
  root.appendChild(text);
  return { node: text, offset: 0 };
}

function getBlockFormat(block: HTMLElement | null): BlockFormat {
  const tag = block?.tagName.toLowerCase();
  if (tag === 'h2' || tag === 'h3' || tag === 'blockquote' || tag === 'pre') return tag;
  return 'p';
}

function replaceCurrentBlock(block: HTMLElement, tag: BlockFormat, selection: Selection) {
  if (!selection.rangeCount) return false;
  const range = selection.getRangeAt(0);
  const startOffset = getTextOffset(block, range.startContainer, range.startOffset);
  const endOffset = Math.max(startOffset, getTextOffset(block, range.endContainer, range.endOffset));
  const replacement = document.createElement(tag);
  while (block.firstChild) replacement.appendChild(block.firstChild);
  block.replaceWith(replacement);

  const startPoint = getTextPoint(replacement, startOffset);
  const endPoint = getTextPoint(replacement, endOffset);
  const nextRange = document.createRange();
  nextRange.setStart(startPoint.node, startPoint.offset);
  nextRange.setEnd(endPoint.node, endPoint.offset);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  return true;
}
function insertHtml(html: string) {
  document.execCommand('insertHTML', false, sanitizeNoteHtml(html));
}

function ToolButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`rich-editor-tool ${active ? 'is-active' : ''}`}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function RichNoteEditor({
  noteId,
  value,
  onChange,
}: {
  noteId: string;
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [isEmpty, setIsEmpty] = useState(() => isEditorVisuallyEmpty(noteContentToHtml(value)));
  const [imageCount, setImageCount] = useState(0);
  const [insertStatus, setInsertStatus] = useState('');
  const [blockFormat, setBlockFormat] = useState<BlockFormat>('p');
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [linkComposerOpen, setLinkComposerOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.innerHTML = noteContentToHtml(value);
    setIsEmpty(isEditorVisuallyEmpty(editor.innerHTML));
    setImageCount(editor.querySelectorAll('img').length);
    setBlockFormat('p');
    setInsertStatus('');
    setFormatMenuOpen(false);
    setLinkComposerOpen(false);
    setLinkValue('');
    selectionRef.current = null;
  }, [noteId]);

  function rememberSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    selectionRef.current = range.cloneRange();
    const block = findEditableBlock(editor, range.startContainer);
    const nextFormat = getBlockFormat(block);
    setBlockFormat((current) => current === nextFormat ? current : nextFormat);
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const saved = selectionRef.current;
    if (!saved || !editor.contains(saved.commonAncestorContainer)) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(saved);
  }

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) return;
    const html = sanitizeNoteHtml(editor.innerHTML);
    setIsEmpty(isEditorVisuallyEmpty(html));
    setImageCount(editor.querySelectorAll('img').length);
    onChange(html);
    rememberSelection();
  }

  function command(name: string, commandValue?: string) {
    restoreSelection();
    document.execCommand(name, false, commandValue);
    emitChange();
  }

  function applyBlockFormat(format: BlockFormat) {
    restoreSelection();
    const editor = editorRef.current;
    const selection = window.getSelection();
    const currentBlock = editor && selection?.rangeCount
      ? findEditableBlock(editor, selection.getRangeAt(0).startContainer)
      : null;
    const currentTag = currentBlock?.tagName.toLowerCase();

    if (selection && currentBlock && (format === 'pre' || currentTag === 'pre')) {
      if (currentTag !== format) replaceCurrentBlock(currentBlock, format, selection);
    } else {
      document.execCommand('formatBlock', false, format);
    }
    setBlockFormat(format);
    setFormatMenuOpen(false);
    emitChange();
  }

  function toggleCodeBlock() {
    restoreSelection();
    const editor = editorRef.current;
    const selection = window.getSelection();
    const currentBlock = editor && selection?.rangeCount
      ? findEditableBlock(editor, selection.getRangeAt(0).startContainer)
      : null;
    applyBlockFormat(getBlockFormat(currentBlock) === 'pre' ? 'p' : 'pre');
  }

  function toggleLinkComposer() {
    if (linkComposerOpen) {
      setLinkComposerOpen(false);
      return;
    }
    rememberSelection();
    setLinkValue('');
    setLinkComposerOpen(true);
  }

  function insertLink() {
    const safe = safeUrl(linkValue);
    if (!safe) {
      setInsertStatus('请输入有效链接');
      window.setTimeout(() => setInsertStatus(''), 1400);
      return;
    }

    restoreSelection();
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return;

    let range: Range;
    if (selection.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const anchor = document.createElement('a');
    anchor.href = safe;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer noopener';
    if (range.collapsed) {
      anchor.textContent = linkValue.trim() || safe;
    } else {
      anchor.appendChild(range.extractContents());
    }
    range.insertNode(anchor);

    const nextRange = document.createRange();
    nextRange.setStartAfter(anchor);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    selectionRef.current = nextRange.cloneRange();
    setLinkComposerOpen(false);
    setLinkValue('');
    emitChange();
    setInsertStatus('链接已插入');
    window.setTimeout(() => setInsertStatus(''), 1400);
  }
  async function insertImage(file: File) {
    rememberSelection();
    try {
      setInsertStatus('正在处理图片…');
      const dataUrl = await imageFileToDataUrl(file);
      if (!dataUrl) return;
      restoreSelection();
      insertHtml(`<figure><img src="${escapeHtml(dataUrl)}" alt="粘贴的图片"></figure><p><br></p>`);
      emitChange();
      setInsertStatus('图片已插入，可继续在图片前后编辑');
      window.setTimeout(() => setInsertStatus(''), 1800);
    } catch {
      setInsertStatus('图片读取失败');
    }
  }
  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      event.preventDefault();
      const file = imageItem.getAsFile();
      if (file) void insertImage(file);
      return;
    }

    const html = event.clipboardData.getData('text/html');
    if (html) {
      event.preventDefault();
      rememberSelection();
      restoreSelection();
      insertHtml(html);
      emitChange();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    const image = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith('image/'));
    if (!image) return;
    event.preventDefault();
    void insertImage(image);
  }

  return (
    <div className="rich-editor-shell">
      <div className="rich-editor-toolbar" role="toolbar" aria-label="笔记编辑工具栏">
        <div className="rich-editor-tool-group">
          <ToolButton label="撤销" onClick={() => command('undo')}><Undo2 size={16} /></ToolButton>
          <ToolButton label="重做" onClick={() => command('redo')}><Redo2 size={16} /></ToolButton>
        </div>
        <span className="rich-editor-divider" />
        <div className="rich-editor-tool-group">
          <ToolButton label="粗体" onClick={() => command('bold')}><Bold size={16} /></ToolButton>
          <ToolButton label="斜体" onClick={() => command('italic')}><Italic size={16} /></ToolButton>
          <ToolButton label="下划线" onClick={() => command('underline')}><Underline size={16} /></ToolButton>
          <ToolButton label="清除格式" onClick={() => command('removeFormat')}><RemoveFormatting size={16} /></ToolButton>
        </div>
        <span className="rich-editor-divider" />
        <div className={`rich-editor-block-menu ${formatMenuOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            className="rich-editor-block-trigger"
            aria-haspopup="menu"
            aria-expanded={formatMenuOpen}
            onMouseDown={(event) => { rememberSelection(); event.preventDefault(); }}
            onClick={() => setFormatMenuOpen((open) => !open)}
          >
            <span>{getBlockFormatLabel(blockFormat)}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {formatMenuOpen && (
            <div className="rich-editor-block-popover" role="menu" aria-label="段落样式">
              {blockFormatOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`rich-editor-block-option ${option.value === blockFormat ? 'selected' : ''}`}
                  role="menuitemradio"
                  aria-checked={option.value === blockFormat}
                  onMouseDown={(event) => { event.preventDefault(); }}
                  onClick={() => applyBlockFormat(option.value)}
                >
                  <span><strong>{option.label}</strong><small>{option.hint}</small></span>
                  {option.value === blockFormat && <Check size={15} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="rich-editor-tool-group">
          <ToolButton label="无序列表" onClick={() => command('insertUnorderedList')}><List size={16} /></ToolButton>
          <ToolButton label="有序列表" onClick={() => command('insertOrderedList')}><ListOrdered size={16} /></ToolButton>
          <ToolButton label="引用" onClick={() => applyBlockFormat('blockquote')}><Quote size={16} /></ToolButton>
          <ToolButton label={blockFormat === 'pre' ? '退出代码块' : '代码块'} active={blockFormat === 'pre'} onClick={toggleCodeBlock}><Code2 size={16} /></ToolButton>
          <ToolButton label="插入链接" active={linkComposerOpen} onClick={toggleLinkComposer}><Link2 size={16} /></ToolButton>
          <ToolButton label="插入图片" onClick={() => fileInputRef.current?.click()}><ImagePlus size={16} /></ToolButton>
        </div>
        {linkComposerOpen && (
          <div className="rich-editor-link-composer" role="dialog" aria-label="插入链接">
            <input
              autoFocus
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') { event.preventDefault(); insertLink(); }
                if (event.key === 'Escape') { setLinkComposerOpen(false); }
              }}
              placeholder="粘贴或输入网址，例如 example.com"
            />
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={insertLink}>插入</button>
            <button type="button" className="cancel" onMouseDown={(event) => event.preventDefault()} onClick={() => setLinkComposerOpen(false)}>取消</button>
          </div>
        )}
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void insertImage(file);
            event.target.value = '';
          }}
        />
      </div>

      <div
        ref={editorRef}
        className={`rich-editor-content ${isEmpty ? 'is-empty' : ''}`}
        contentEditable
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning
        data-placeholder="从这里开始记录。支持粘贴图片、拖入截图和丰富排版…"
        onInput={emitChange}
        onSelect={rememberSelection}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onFocus={rememberSelection}
        onPaste={handlePaste}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            emitChange();
            setInsertStatus('已保存');
            window.setTimeout(() => setInsertStatus(''), 1200);
          }
        }}
      />

      <div className="rich-editor-statusbar">
        <span><i /> 自动保存到本地文件</span>
        <span>{imageCount ? `${imageCount} 张图片 · ` : ''}{noteTextPreview(editorRef.current?.innerHTML ?? value).length} 字</span>
        {insertStatus && <em>{insertStatus}</em>}
      </div>
    </div>
  );
}
