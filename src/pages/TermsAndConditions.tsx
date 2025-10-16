
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageWrapper from '../components/PageWrapper';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import api from '../api/api';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {TextStyle} from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';

// Icons
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import LinkIcon from '@mui/icons-material/Link';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const headings = [
  { label: 'Paragraph', level: 0 },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
];

const TermsAndConditions: React.FC = () => {
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(false);

  const [headingAnchor, setHeadingAnchor] = useState<null | HTMLElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: true }),
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({
        multicolor: true, 
      }),
    ],
    content: content || '<p></p>',
    editable: editing,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/terms?lang=en');
        setContent(res.data.html || '');
        editor?.commands.setContent(res.data.html || '');
      } catch (err) {
        console.error('Failed to fetch terms', err);
      }
    })();
  }, [editor]);

  const handleUpdate = async () => {
    try {
    await api.post('/terms/update', { html :content, language: "en" });
      setEditing(false);
      editor?.setEditable(false);
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    editor?.setEditable(true);
  };

  const handleCancel = () => {
    setEditing(false);
    editor?.setEditable(false);
    editor?.commands.setContent(content);
  };

  // Toolbar actions
  const applyTextColor = (color: string) => {
    setTextColor(color);
    editor?.chain().focus().setColor(color).run();
  };

  const applyBgColor = (color: string) => {
    setBgColor(color);
    editor?.chain().focus().setHighlight({ color }).run();
  };

  const insertLink = () => {
    if (!linkUrl) return;
    editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl('');
  };

  // Heading dropdown
  const openHeadingMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setHeadingAnchor(event.currentTarget);
  };
  const closeHeadingMenu = () => setHeadingAnchor(null);
  const setHeading = (level: any) => {
    if (level === 0) editor?.chain().focus().setParagraph().run();
    else editor?.chain().focus().toggleHeading({ level }).run();
    closeHeadingMenu();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box style={{flex:1}}>
      <PageWrapper>
        <Typography variant="h4" gutterBottom>
          Terms & Conditions
        </Typography>

        {editing && editor ? (
          <>
            {/* Toolbar */}
            <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {/* Text styles */}
              <Tooltip title="Bold">
                <IconButton onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'}>
                  <FormatBoldIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Italic">
                <IconButton onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'}>
                  <FormatItalicIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Underline">
                <IconButton onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive('underline') ? 'primary' : 'default'}>
                  <FormatUnderlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Strikethrough">
                <IconButton onClick={() => editor.chain().focus().toggleStrike().run()} color={editor.isActive('strike') ? 'primary' : 'default'}>
                  <StrikethroughSIcon />
                </IconButton>
              </Tooltip>

              {/* Headings */}
              <Button endIcon={<ArrowDropDownIcon />} onClick={openHeadingMenu} variant="outlined" size="small">
                Heading
              </Button>
              <Menu anchorEl={headingAnchor} open={Boolean(headingAnchor)} onClose={closeHeadingMenu}>
                {headings.map((h) => (
                  <MenuItem key={h.level} onClick={() => setHeading(h.level)}>
                    {h.label}
                  </MenuItem>
                ))}
              </Menu>

              {/* Lists */}
              <Tooltip title="Bullet List">
                <IconButton onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'}>
                  <FormatListBulletedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Numbered List">
                <IconButton onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'}>
                  <FormatListNumberedIcon />
                </IconButton>
              </Tooltip>

              {/* Undo/Redo */}
              <Tooltip title="Undo">
                <IconButton onClick={() => editor.chain().focus().undo().run()}>
                  <UndoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Redo">
                <IconButton onClick={() => editor.chain().focus().redo().run()}>
                  <RedoIcon />
                </IconButton>
              </Tooltip>

              {/* Link */}
              <TextField
                size="small"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                sx={{ width: 200 }}
              />
              <Tooltip title="Insert Link">
                <IconButton onClick={insertLink}>
                  <LinkIcon />
                </IconButton>
              </Tooltip>

              {/* Colors */}
              <Tooltip title="Text Color">
                <TextField type="color" value={textColor} onChange={(e) => applyTextColor(e.target.value)} size="small" sx={{ width: 50, p: 0 }} />
              </Tooltip>
              <Tooltip title="Highlight Color">
                <TextField type="color" value={bgColor} onChange={(e) => applyBgColor(e.target.value)} size="small" sx={{ width: 50, p: 0 }} />
              </Tooltip>
            </Box>

            {/* Editor */}
            <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, minHeight: 300 }}>
              <EditorContent editor={editor} />
            </Box>

            <Button onClick={handleUpdate} variant="contained" sx={{ mt: 2 }}>
              Save
            </Button>
            <Button onClick={handleCancel} variant="outlined" sx={{ mt: 2, ml: 2 }}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, minHeight: 200 }} dangerouslySetInnerHTML={{ __html: content }} />
            <Button onClick={handleEdit} variant="outlined" sx={{ mt: 2 }}>
              Edit
            </Button>
          </>
        )}
      </PageWrapper>
      </Box>
    </Box>
  );
};

export default TermsAndConditions;
