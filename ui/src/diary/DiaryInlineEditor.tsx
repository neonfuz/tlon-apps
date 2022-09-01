import classNames from 'classnames';
import { EditorView } from 'prosemirror-view';
import { PluginKey } from 'prosemirror-state';
import {
  Editor as EditorCore,
  EditorOptions,
  KeyboardShortcutCommand,
  Range,
} from '@tiptap/core';
import {
  Editor,
  EditorContent,
  Extension,
  JSONContent,
  ReactRenderer,
  useEditor,
} from '@tiptap/react';
import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef,
} from 'react';
import Document from '@tiptap/extension-document';
import Blockquote from '@tiptap/extension-blockquote';
import Placeholder from '@tiptap/extension-placeholder';
import Bold from '@tiptap/extension-bold';
import Code from '@tiptap/extension-code';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Link from '@tiptap/extension-link';
import Text from '@tiptap/extension-text';
import cn from 'classnames';
import History from '@tiptap/extension-history';
import Paragraph from '@tiptap/extension-paragraph';
import HardBreak from '@tiptap/extension-hard-break';
import { useIsMobile } from '@/logic/useMedia';
import ChatInputMenu from '@/chat/ChatInputMenu/ChatInputMenu';
import { Shortcuts } from '@/logic/tiptap';
import Suggestion, {
  SuggestionOptions,
  SuggestionPluginKey,
} from '@tiptap/suggestion';
import { createPopper } from '@popperjs/core';
import tippy from 'tippy.js';
import DiaryImageNode from './DiaryImageNode';
import DiaryLinkNode from './DiaryLinkNode';

EditorView.prototype.updateState = function updateState(state) {
  if (!(this as any).docView) return; // This prevents the matchesNode error on hot reloads
  (this as any).updateStateInner(state, this.state.plugins != state.plugins); //eslint-disable-line
};

interface HandlerParams {
  editor: Editor;
}

interface useDiaryInlineEditorParams {
  content: JSONContent | string;
  placeholder?: string;
  onEnter: KeyboardShortcutCommand;
  onUpdate?: EditorOptions['onUpdate'];
  onBlur?: EditorOptions['onBlur'];
  autofocus?: boolean;
}
const ActionMenuPluginKey = new PluginKey('action-menu');

interface ActionMenuRef {
  onKeyDown: (p: { event: KeyboardEvent }) => boolean;
}

interface ActionMenuItemProps {
  title: string;
  command: (p: { editor: Editor; range: Range }) => void;
}

const ActionMenuBar = forwardRef<
  any,
  { items: ActionMenuItemProps[]; command: any }
>((props, ref) => {
  console.log(props);
  const { items = [] } = props;
  const [selected, setSelected] = useState(0);
  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      const len = items.length;
      if (event.key === 'ArrowUp') {
        setSelected((s) => (s + len - 1) % len);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelected((s) => (s + 1) % len);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selected);
        return true;
      }

      return false;
    },
  }));

  return (
    <ul className="w-32 border border-black bg-white" ref={ref}>
      {items.map((s: ActionMenuItemProps, idx: number) => (
        <li
          key={s.title}
          className={cn(
            'w-100 p-2',
            selected === idx ? 'bg-gray-100' : 'bg-white'
          )}
        >
          {s.title}
        </li>
      ))}
    </ul>
  );
});

interface ActionMenuOptions {
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

const ActionMenu = Extension.create<ActionMenuOptions>({
  name: 'action-menu',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: ActionMenuPluginKey,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }: any): ActionMenuItemProps[] => {
          const nedl = query.toLowerCase();

          const hstk: ActionMenuItemProps[] = [
            {
              title: 'Image',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .splitBlock()
                  .insertContent([
                    { type: 'diary-image' },
                    { type: 'paragraph' },
                  ])
                  .selectNodeBackward()
                  .run();
              },
            },
            {
              title: 'Web Link',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent([
                    { type: 'diary-link' },
                    { type: 'paragraph' },
                  ])
                  .selectNodeBackward()
                  .run();
              },
            },
            {
              title: 'Urbit Link',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent([
                    { type: 'diary-link' },
                    { type: 'paragraph' },
                  ])
                  .selectNodeBackward()
                  .run();
              },
            },
            {
              title: 'Blockquote',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleBlockquote()
                  .run();
              },
            },
            {
              title: 'Code block',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleCode().run();
              },
            },
          ];
          return hstk.filter(
            ({ title }) => title.toLowerCase().search(nedl) !== -1
          );
        },
        render: () => {
          let component: ReactRenderer<any, any> | null;
          let popup: any;
          return {
            onStart: (props) => {
              component = new ReactRenderer<any, any>(ActionMenuBar, props);
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as any,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate: (props) => {
              if (props.items.length === 0) {
                popup[0]?.hide();
                return true;
              }
              component?.updateProps(props);

              popup[0].setProps({
                getBoundingClientRect: props.clientRect,
              });
              return true;
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup[0]?.hide();
                return true;
              }
              return component?.ref?.onKeyDown(props);
            },
            onExit: () => {
              popup[0].destroy();
              component?.destroy();
            },
          };
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [Suggestion({ ...this.options.suggestion, editor: this.editor })];
  },
});

export function useDiaryInlineEditor({
  content,
  placeholder,
  autofocus = false,
  onEnter,
  onUpdate,
  onBlur,
}: useDiaryInlineEditorParams) {
  const ed = useEditor(
    {
      extensions: [
        Blockquote,
        Bold,
        Code.extend({ excludes: undefined }),
        Document,
        HardBreak,
        History.configure({ newGroupDelay: 100 }),
        Italic,
        Link.configure({
          openOnClick: false,
        }),
        Paragraph,
        Placeholder.configure({
          placeholder:
            'Start writing here, or click the menu to add a link block',
          showOnlyCurrent: false,
          showOnlyWhenEditable: false,
          includeChildren: true,
        }),
        Strike,
        Text,
        Shortcuts({
          Enter: onEnter,
        }),
        ActionMenu,
        DiaryImageNode,
        DiaryLinkNode,
      ],
      content: content || '',
      editorProps: {
        attributes: {
          class: 'input-transparent',
          'aria-label': 'Note editor with formatting menu',
        },
      },
      onBlur,
      onUpdate: onUpdate || (() => false),
      onCreate: ({ editor }) => {
        if (autofocus) {
          editor.chain().focus().run();
        }
      },
    },
    [placeholder, onBlur, autofocus]
  );

  useEffect(() => {
    if (ed && !ed.isDestroyed) {
      const com = ed.chain().clearContent().insertContent(content);
      if (content !== '') {
        com.focus();
      }
      com.run();
    }
  }, [ed, content]);

  return ed;
}

interface DiaryInlineEditorProps {
  editor: Editor;
  className?: string;
}

export default function DiaryInlineEditor({
  editor,
  className,
}: DiaryInlineEditorProps) {
  const isMobile = useIsMobile();
  return (
    <div className={classNames('input-transparent block p-0', className)}>
      {/* This is nested in a div so that the bubble  menu is keyboard accessible */}
      <EditorContent className="w-full" editor={editor} />
      {!isMobile ? <ChatInputMenu editor={editor} /> : null}
    </div>
  );
}
