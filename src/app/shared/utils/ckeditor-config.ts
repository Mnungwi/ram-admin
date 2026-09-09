// Shared CKEditor config for every plain <textarea> across the app that
// was converted to a rich-text editor (per explicit request: every text
// area should look/behave the same as Letters > Compose > Letter Body).
// Kept deliberately light — these are short notes/descriptions, not page
// builders — same config Letters already used.
export const CKEDITOR_CONFIG = {
  uiColor: '#F0F3F4',
  height: '200',
  extraPlugins: 'divarea',
  versionCheck: false,
  removePlugins: 'elementspath',
  resize_enabled: false,
  toolbarGroups: [
    { name: 'basicstyles', groups: ['basicstyles'] },
    { name: 'paragraph', groups: ['list', 'indent', 'align'] },
    { name: 'links' },
    { name: 'clipboard', groups: ['undo'] },
  ],
  removeButtons: 'Strike,Subscript,Superscript,Anchor,CopyFormatting,BlockQuote,Language,BidiLtr,BidiRtl',
};
