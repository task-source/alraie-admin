import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Heading, { Level } from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Header from "../components/Header";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List as ListIcon,
  ListOrdered as ListOrderedIcon,
  Undo2,
  Redo2,
  Link as LinkIcon,
} from "lucide-react";
import { useAlert } from "../context/AlertContext";

const headings: { label: string; level: Level | 0 }[] = [
  { label: "Paragraph", level: 0 },
  { label: "Heading 1", level: 1 },
  { label: "Heading 2", level: 2 },
  { label: "Heading 3", level: 3 },
];

const PrivacyPolicy: React.FC = () => {
  const { showAlert, showApiError } = useAlert();
  const { showLoader, hideLoader } = useLoader();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [contentEn, setContentEn] = useState("");
  const [contentAr, setContentAr] = useState("");
  const [editing, setEditing] = useState(false);

  const [linkUrl, setLinkUrl] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showHeadings, setShowHeadings] = useState(false);

  const currentContent = lang === "en" ? contentEn : contentAr;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: true }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
    ],
    content: "<p></p>",
    editable: editing,
    onCreate: ({ editor }) => {
      (window as any).editor = editor;
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (lang === "en") setContentEn(html);
      else setContentAr(html);
    },
  });

  useEffect(() => {
    (async () => {
      showLoader();
      try {
        const results = await Promise.allSettled([
          api.get("/privacyPolicy?lang=en"),
          api.get("/privacyPolicy?lang=ar"),
        ]);

        const enRes =
          results[0].status === "fulfilled"
            ? results[0].value.data.html || ""
            : "";
        const arRes =
          results[1].status === "fulfilled"
            ? results[1].value.data.html || ""
            : "";

        setContentEn(enRes);
        setContentAr(arRes);

        editor?.commands.setContent(lang === "en" ? enRes : arRes);
      } catch (err) {
        showApiError(err);
      } finally {
        hideLoader();
      }
    })();
  }, [editor, lang]);

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(
        lang === "en" ? contentEn || "<p></p>" : contentAr || "<p></p>"
      );
    }
  }, [lang, editor]);

  const handleUpdate = async () => {
    showLoader();
    try {
      const html = lang === "en" ? contentEn : contentAr;
      const res = await api.post("/privacyPolicy/update", {
        html,
        language: lang,
      });
      setEditing(false);
      editor?.setEditable(false);
      if (res.data.success) {
        showAlert("success", "Privacy Policy updated successfully");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const handleCancel = () => {
    setEditing(false);
    editor?.setEditable(false);
    editor?.commands.setContent(currentContent);
  };

  const insertLink = () => {
    if (!linkUrl) return;
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setLinkUrl("");
  };

  const toggleBullet = () => {
    if (!editor) return;
    editor.chain().focus().toggleBulletList().run();
  };

  const toggleOrdered = () => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  };

  const setHeadingLevel = (level: number) => {
    if (!editor) return;

    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      if (editor.isActive("heading", { level })) {
        editor.chain().focus().setParagraph().run();
      } else {
        editor
          .chain()
          .focus()
          .setHeading({ level: level as Level })
          .run();
      }
    }
    setShowHeadings(false);
  };


  const currentHeading = (() => {
    for (const h of [1, 2, 3]) {
      if (editor?.isActive("heading", { level: h })) return h;
    }
    return 0;
  })();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <PageWrapper>
          <h1 className="text-3xl font-semibold mb-6">Privacy Policy</h1>

          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setLang("en")}
              className={`px-4 py-2 text-sm font-medium ${
                lang === "en"
                  ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
                  : "text-gray-500"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("ar")}
              className={`px-4 py-2 text-sm font-medium ${
                lang === "ar"
                  ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
                  : "text-gray-500"
              }`}
            >
              Arabic
            </button>
          </div>

          {editing && editor ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded ${
                    editor.isActive("bold")
                      ? "bg-[#4F46E5] text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded ${
                    editor.isActive("italic")
                      ? "bg-[#4F46E5] text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-2 rounded ${
                    editor.isActive("underline")
                      ? "bg-[#4F46E5] text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <UnderlineIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-2 rounded ${
                    editor.isActive("strike")
                      ? "bg-[#4F46E5] text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Strikethrough className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowHeadings(!showHeadings)}
                    className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-sm"
                  >
                    {currentHeading === 0
                      ? "Paragraph"
                      : `Heading ${currentHeading}`}{" "}
                    ▼
                  </button>
                  {showHeadings && (
                    <div className="absolute mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-md z-10">
                      {headings.map((h) => (
                        <button
                          key={h.level}
                          onClick={() => setHeadingLevel(h.level)}
                          className={`block px-4 py-2 text-left w-full ${
                            currentHeading === h.level
                              ? "bg-[#4F46E5] text-white"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleBullet}
                  className={`p-2 rounded ${
                    editor.isActive("bulletList")
                      ? "bg-[#4F46E5] text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleOrdered}
                  className={`p-2 rounded ${
                    editor.isActive("orderedList")
                      ? "bg-[#4F46E5] text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ListOrderedIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => editor.chain().focus().undo().run()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().redo().run()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm w-40 bg-transparent"
                />
                <button
                  onClick={insertLink}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <input
                  type="color"
                  value={textColor}
                  onChange={(e) =>
                    editor?.chain().focus().setColor(e.target.value).run()
                  }
                  className="w-8 h-8 border rounded"
                />
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) =>
                    editor
                      ?.chain()
                      .focus()
                      .setHighlight({ color: e.target.value })
                      .run()
                  }
                  className="w-8 h-8 border rounded"
                />
              </div>

              <div
                className={`editor-root border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[300px] bg-white dark:bg-gray-800 ${
                  lang === "ar" ? "text-right" : "text-left"
                }`}
                dir={lang === "ar" ? "rtl" : "ltr"}
              >
                <EditorContent editor={editor} />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleUpdate}
                  className="bg-[#4F46E5] hover:bg-[#0000CC] text-white px-5 py-2 rounded-lg font-medium"
                >
                  Save ({lang.toUpperCase()})
                </button>
                <button
                  onClick={handleCancel}
                  className="border border-gray-300 dark:border-gray-600 px-5 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[250px] bg-white dark:bg-gray-800 ${
                  lang === "ar" ? "text-right" : "text-left"
                }`}
                dir={lang === "ar" ? "rtl" : "ltr"}
                dangerouslySetInnerHTML={{ __html: currentContent }}
              />
              <button
                onClick={() => {
                  setEditing(true);
                  editor?.setEditable(true);
                }}
                className="mt-4 border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white px-5 py-2 rounded-lg font-medium transition"
              >
                Edit
              </button>
            </>
          )}
        </PageWrapper>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
