import { Editor } from '@tinymce/tinymce-react';
import 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/themes/silver';
import 'tinymce/models/dom';
import 'tinymce/skins/ui/oxide/skin.css';
import 'tinymce/skins/content/default/content.css';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/directionality';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/emoticons/js/emojis';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/help';
import 'tinymce/plugins/image';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/media';
import 'tinymce/plugins/nonbreaking';
import 'tinymce/plugins/pagebreak';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/quickbars';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/table';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/visualchars';
import 'tinymce/plugins/wordcount';

const PLUGINS = [
  'advlist', 'anchor', 'autolink', 'autoresize', 'charmap', 'directionality',
  'emoticons', 'fullscreen', 'help', 'image', 'insertdatetime', 'link', 'lists',
  'media', 'nonbreaking', 'pagebreak', 'preview', 'quickbars', 'searchreplace',
  'table', 'visualblocks', 'visualchars', 'wordcount',
];

const TOOLBAR = [
  'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor',
  'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat',
  'link anchor image media table charmap emoticons insertdatetime | searchreplace visualblocks preview fullscreen',
].join(' | ');

// Editor tipo Word (self-hosted, sem API key) — usado nas descrições de produtos
export default function RichTextEditor({ value, onChange }) {
  return (
    <Editor
      licenseKey="gpl"
      value={value}
      onEditorChange={(content) => onChange?.(content)}
      init={{
        min_height: 400,
        autoresize_bottom_margin: 24,
        menubar: 'edit view insert format table tools help',
        plugins: PLUGINS,
        toolbar: TOOLBAR,
        // Sem endpoint de upload ainda: imagens coladas/arrastadas viram base64 embutido no HTML
        images_upload_handler: undefined,
        skin: false,
        content_css: false,
        branding: false,
      }}
    />
  );
}
