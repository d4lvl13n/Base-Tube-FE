import React from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Info } from 'lucide-react';
import * as S from '../styles';
import { FormData } from '../types'; // Updated import path
import RichTextEditor from '../../../../../components/common/RichTextEditor'; // Corrected path for RichTextEditor

interface StepDescriptionProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
}

const StepDescription: React.FC<StepDescriptionProps> = ({ control, errors }) => {
  return (
    <>
      <S.FormGroup>
        <S.Label htmlFor="description">Description *</S.Label>
        <Controller
          name="description"
          control={control}
          rules={{ 
            required: 'Description is required',
            minLength: {
              value: 20,
              message: 'Description must be at least 20 characters'
            }
          }}
          render={({ field }) => (
            <RichTextEditor
              content={field.value || ''}
              onChange={field.onChange}
              placeholder="Describe your premium content in detail. What will subscribers get? Why is it valuable? Be compelling!"
              minHeight="300px"
            />
          )}
        />
        {errors.description && (
          <S.ErrorText>{errors.description.message}</S.ErrorText>
        )}
      </S.FormGroup>
      
      <S.InfoBox>
        <Info size={24} className="text-[#fa7517]" />
        <div>
          <h4 className="font-medium mb-2">Write a Compelling Description</h4>
          <S.InfoText>
            A great description is key to selling your content pass. Be specific about what value you're providing, 
            and why viewers should purchase. This description will be displayed on your pass page.
          </S.InfoText>
        </div>
      </S.InfoBox>
    </>
  );
};

export default StepDescription;
