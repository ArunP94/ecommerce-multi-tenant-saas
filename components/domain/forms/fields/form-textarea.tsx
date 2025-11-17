"use client";

import React from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";

interface FormTextareaProps<T extends FieldValues> {
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  description?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  placeholder,
  description,
  rows = 4,
  required,
  disabled,
  className,
}: FormTextareaProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              {...field}
              disabled={disabled}
              required={required}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
