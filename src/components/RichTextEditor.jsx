import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import { useRef } from 'react'
import { FontSize } from '../lib/fontSizeExtension.js'
import { supabase } from '../lib/supabaseClient.js'

const BUCKET = 'activity-photos'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const FONT_SIZES = [
  { label: '작게', value: '13px' },
  { label: '보통', value: '' },
  { label: '크게', value: '20px' },
  { label: '아주 크게', value: '28px' },
]

const COLORS = ['#1f2937', '#dc2626', '#d97706', '#16a34a', '#2563eb', '#7c3aed']

async function uploadImage(file) {
  const ext = file.name.split('.').pop()
  const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// 툴바 버튼을 누르는 순간(mousedown) 에디터 밖으로 포커스가 옮겨가면서
// 방금 드래그한 텍스트 선택이 풀려버리는 걸 막기 위한 핸들러.
const preventFocusLoss = (e) => e.preventDefault()

function RichTextEditor({ content, onChange, placeholder }) {
  const fileInputRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontSize,
      Image.configure({ HTMLAttributes: { class: 'board-editor__image' } }),
      Placeholder.configure({ placeholder: placeholder || '내용을 입력하세요' }),
    ],
    content: content || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: { class: 'board-editor__content' },
    },
  })

  if (!editor) return null

  const onPickImage = () => fileInputRef.current?.click()

  const onImageSelected = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      window.alert('PNG, JPG, WEBP, GIF 형식만 업로드할 수 있습니다.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      window.alert('이미지 용량은 5MB 이하만 가능합니다.')
      return
    }

    try {
      const url = await uploadImage(file)
      editor.chain().focus().setImage({ src: url }).run()
    } catch {
      window.alert('이미지 업로드에 실패했습니다.')
    }
  }

  return (
    <div className="board-editor">
      <div className="board-editor__toolbar">
        <button
          type="button"
          className={editor.isActive('bold') ? 'is-active' : ''}
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={editor.isActive('italic') ? 'is-active' : ''}
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={editor.isActive('underline') ? 'is-active' : ''}
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>

        <span className="board-editor__divider" />

        {FONT_SIZES.map((f) => (
          <button
            key={f.label}
            type="button"
            className={editor.isActive('textStyle', { fontSize: f.value || null }) ? 'is-active' : ''}
            onMouseDown={preventFocusLoss}
            onClick={() => {
              if (f.value) editor.chain().focus().setFontSize(f.value).run()
              else editor.chain().focus().unsetFontSize().run()
            }}
          >
            {f.label}
          </button>
        ))}

        <span className="board-editor__divider" />

        <span className="board-editor__colors">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="board-editor__color-swatch"
              style={{ background: c }}
              onMouseDown={preventFocusLoss}
              onClick={() => editor.chain().focus().setColor(c).run()}
              aria-label={`글자색 ${c}`}
            />
          ))}
          <button
            type="button"
            className="board-editor__color-reset"
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().unsetColor().run()}
          >
            색상 지우기
          </button>
        </span>

        <span className="board-editor__divider" />

        <button
          type="button"
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          목록
        </button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={onPickImage}>
          이미지
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={onImageSelected}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor
