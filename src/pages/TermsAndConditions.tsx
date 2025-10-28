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
  Tabs,
  Tab,
} from '@mui/material';
import api from '../api/api';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { useLoader } from "../context/LoaderContext";

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
  const { showLoader, hideLoader } = useLoader();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [contentEn, setContentEn] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [editing, setEditing] = useState(false);

  const [headingAnchor, setHeadingAnchor] = useState<null | HTMLElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  const currentContent = lang === 'en' ? contentEn : contentAr;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: true }),
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
    ],
    content: '<p></p>',
    editable: editing,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (lang === 'en') setContentEn(html);
      else setContentAr(html);
    },
  });

  // 🔹 Fetch both EN + AR content initially
  useEffect(() => {
    (async () => {
      showLoader();
      try {
        const results = await Promise.allSettled([
          api.get('/terms?lang=en'),
          api.get('/terms?lang=ar'),
        ]);
  
        // English result
        const enRes =
          results[0].status === 'fulfilled' ? results[0].value.data.html || '' : '';
        // Arabic result
        const arRes =
          results[1].status === 'fulfilled' ? results[1].value.data.html || '' : '';
  
        setContentEn(enRes);
        setContentAr(arRes);
  
        // Load editor based on current language
        if (lang === 'en') editor?.commands.setContent(enRes);
        else editor?.commands.setContent(arRes);
      } catch (err) {
        console.error('Failed to fetch one or more terms', err);
      }finally{
        hideLoader()
      }
    })();
  }, [editor, lang]);

  // 🔹 Update editor content on tab switch
  useEffect(() => {
    if (editor) {
      const html = lang === 'en' ? contentEn : contentAr;
      editor.commands.setContent(html || '<p></p>');
    }
  }, [lang, editor]);

  const handleUpdate = async () => {
    try {
      showLoader();
      const html = lang === 'en' ? contentEn : contentAr;
      await api.post('/terms/update', { html, language: lang });
      setEditing(false);
      editor?.setEditable(false);
    } catch (err) {
      console.error('Update failed', err);
    }finally{
      hideLoader()
    }
  };

  const handleEdit = () => {
    setEditing(true);
    editor?.setEditable(true);
  };

  const handleCancel = () => {
    setEditing(false);
    editor?.setEditable(false);
    editor?.commands.setContent(currentContent);
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
      <Box sx={{ flex: 1 }}>
        <PageWrapper>
          <Typography variant="h4" gutterBottom>
            Terms & Conditions
          </Typography>

          {/* 🔹 Language Tabs */}
          <Tabs
            value={lang}
            onChange={(_, value) => setLang(value)}
            sx={{ mb: 2 }}
            variant="standard"
          >
            <Tab label="English" value="en" />
            <Tab label="Arabic" value="ar" />
          </Tabs>

          {editing && editor ? (
            <>
              {/* Toolbar */}
              <Box
                sx={{
                  mb: 1,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <Tooltip title="Bold">
                  <IconButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    color={editor.isActive('bold') ? 'primary' : 'default'}
                  >
                    <FormatBoldIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Italic">
                  <IconButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    color={editor.isActive('italic') ? 'primary' : 'default'}
                  >
                    <FormatItalicIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Underline">
                  <IconButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    color={editor.isActive('underline') ? 'primary' : 'default'}
                  >
                    <FormatUnderlinedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Strikethrough">
                  <IconButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    color={editor.isActive('strike') ? 'primary' : 'default'}
                  >
                    <StrikethroughSIcon />
                  </IconButton>
                </Tooltip>

                <Button
                  endIcon={<ArrowDropDownIcon />}
                  onClick={openHeadingMenu}
                  variant="outlined"
                  size="small"
                >
                  Heading
                </Button>
                <Menu
                  anchorEl={headingAnchor}
                  open={Boolean(headingAnchor)}
                  onClose={closeHeadingMenu}
                >
                  {headings.map((h) => (
                    <MenuItem key={h.level} onClick={() => setHeading(h.level)}>
                      {h.label}
                    </MenuItem>
                  ))}
                </Menu>

                <Tooltip title="Bullet List">
                  <IconButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    color={editor.isActive('bulletList') ? 'primary' : 'default'}
                  >
                    <FormatListBulletedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Numbered List">
                  <IconButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    color={editor.isActive('orderedList') ? 'primary' : 'default'}
                  >
                    <FormatListNumberedIcon />
                  </IconButton>
                </Tooltip>

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

                <Tooltip title="Text Color">
                  <TextField
                    type="color"
                    value={textColor}
                    onChange={(e) => applyTextColor(e.target.value)}
                    size="small"
                    sx={{ width: 50 }}
                  />
                </Tooltip>
                <Tooltip title="Highlight Color">
                  <TextField
                    type="color"
                    value={bgColor}
                    onChange={(e) => applyBgColor(e.target.value)}
                    size="small"
                    sx={{ width: 50 }}
                  />
                </Tooltip>
              </Box>

              {/* Editor */}
              <Box
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: 2,
                  p: 2,
                  minHeight: 300,
                  direction: lang === 'ar' ? 'rtl' : 'ltr',
                }}
              >
                <EditorContent editor={editor} />
              </Box>

              <Button onClick={handleUpdate} variant="contained" sx={{ mt: 2 }}>
                Save ({lang.toUpperCase()})
              </Button>
              <Button onClick={handleCancel} variant="outlined" sx={{ mt: 2, ml: 2 }}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Box
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: 2,
                  p: 2,
                  minHeight: 200,
                  direction: lang === 'ar' ? 'rtl' : 'ltr',
                }}
                dangerouslySetInnerHTML={{ __html: currentContent }}
              />
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
