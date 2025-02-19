import React from 'react';
import { EmbedSize } from '../../../utils/embed';

interface EmbedPreviewProps {
  embedCode: string;
  size: EmbedSize;
}

export const EmbedPreview: React.FC<EmbedPreviewProps> = ({ embedCode, size }) => {
  return (
    <div className="embed-preview" style={{ 
      width: size.width, 
      height: size.height,
      maxWidth: '100%',
      margin: '0 auto',
      overflow: 'hidden'
    }}>
      <div dangerouslySetInnerHTML={{ __html: embedCode }} />
    </div>
  );
}; 