// export default DynamicForm;
import React, { useState, useRef } from 'react';
import { LucideIcon, Calendar, Clock, Upload, X, Eye, EyeOff } from 'lucide-react';

// Types
export type FieldType =
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'date'
    | 'time'
    | 'datetime-local'
    | 'file'
    | 'switch'
    | 'range'
    | 'color';

export interface SelectOption {
    label: string;
    value: string | number;
}

export interface DynamicFormField {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    value?: any;
    icon?: LucideIcon;
    required?: boolean;
    disabled?: boolean;
    options?: SelectOption[]; // For select, radio
    datalist?: string[]; // For autocomplete dropdowns
    accept?: string; // For file input
    multiple?: boolean; // For file input
    min?: number | string; // For number, date, range
    max?: number | string; // For number, date, range
    step?: number | string; // For number, range
    rows?: number; // For textarea
    pattern?: string; // For validation
    helperText?: string;
    validation?: (value: any) => string | null; // Custom validation function
    className?: string;
}

export interface DynamicFormProps {
    fields: DynamicFormField[];
    onSubmit: (data: Record<string, any>) => void | Promise<void>;
    onFieldChange?: (name: string, value: any) => void; // NEW: callback for external field change handling
    submitLabel?: string;
    cancelLabel?: string;
    onCancel?: () => void;
    showCancel?: boolean;
    className?: string;
    loading?: boolean;
    layout?: 'vertical' | 'horizontal' | 'grid';
    gridCols?: 1 | 2 | 3 | 4;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
    fields,
    onSubmit,
    onFieldChange,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    onCancel,
    showCancel = false,
    className = '',
    loading = false,
    layout = 'vertical',
    gridCols = 2,
}) => {
    // Form state
    const [formData, setFormData] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        fields.forEach(field => {
            if (field.type === 'checkbox' || field.type === 'switch') {
                initial[field.name] = field.value ?? false;
            } else if (field.type === 'file') {
                initial[field.name] = field.multiple ? [] : null;
            } else {
                initial[field.name] = field.value ?? '';
            }
        });
        return initial;
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    React.useEffect(() => {
        setFormData(prev => {
            const updated = { ...prev };
            let hasChange = false;
            fields.forEach(field => {
                if (
                    field.value !== undefined &&
                    field.value !== '' &&
                    field.value !== prev[field.name] &&
                    !touched[field.name]  // <-- don't overwrite touched/dirty fields
                ) {
                    updated[field.name] = field.value;
                    hasChange = true;
                }
            });
            return hasChange ? updated : prev;
        });
    }, [fields]);
    
    // Handle field change
    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Notify parent of field change (enables auto-fill logic)
        onFieldChange?.(name, value);
    };

    // Handle blur - mark field as touched
    const handleBlur = (name: string) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        validateField(name);
    };

    // Validate single field
    const validateField = (name: string) => {
        const field = fields.find(f => f.name === name);
        if (!field) return;

        const value = formData[name];
        let error: string | null = null;

        // Required validation
        if (field.required) {
            if (field.type === 'checkbox' || field.type === 'switch') {
                if (!value) error = `${field.label} is required`;
            } else if (field.type === 'file') {
                if (field.multiple ? (!value || value.length === 0) : !value) {
                    error = `${field.label} is required`;
                }
            } else if (!value || value.toString().trim() === '') {
                error = `${field.label} is required`;
            }
        }

        // Type-specific validation
        if (value && !error) {
            switch (field.type) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) error = 'Invalid email address';
                    break;
                case 'url':
                    try {
                        new URL(value);
                    } catch {
                        error = 'Invalid URL';
                    }
                    break;
                case 'tel':
                    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                    if (!phoneRegex.test(value)) error = 'Invalid phone number';
                    break;
                case 'number':
                case 'range':
                    if (field.min !== undefined && parseFloat(value) < parseFloat(field.min.toString())) {
                        error = `Minimum value is ${field.min}`;
                    }
                    if (field.max !== undefined && parseFloat(value) > parseFloat(field.max.toString())) {
                        error = `Maximum value is ${field.max}`;
                    }
                    break;
            }
        }

        // Custom validation
        if (!error && field.validation && value) {
            error = field.validation(value);
        }

        // Pattern validation
        if (!error && field.pattern && value) {
            const regex = new RegExp(field.pattern);
            if (!regex.test(value)) {
                error = 'Invalid format';
            }
        }

        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    // Validate all fields
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        fields.forEach(field => {
            const value = formData[field.name];
            let error: string | null = null;

            if (field.required) {
                if (field.type === 'checkbox' || field.type === 'switch') {
                    if (!value) error = `${field.label} is required`;
                } else if (field.type === 'file') {
                    if (field.multiple ? (!value || value.length === 0) : !value) {
                        error = `${field.label} is required`;
                    }
                } else if (!value || value.toString().trim() === '') {
                    error = `${field.label} is required`;
                }
            }

            if (value && !error) {
                switch (field.type) {
                    case 'email':
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(value)) error = 'Invalid email address';
                        break;
                    case 'url':
                        try {
                            new URL(value);
                        } catch {
                            error = 'Invalid URL';
                        }
                        break;
                }
            }

            if (!error && field.validation && value) {
                error = field.validation(value);
            }

            if (!error && field.pattern && value) {
                const regex = new RegExp(field.pattern);
                if (!regex.test(value)) {
                    error = 'Invalid format';
                }
            }

            if (error) {
                newErrors[field.name] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched: Record<string, boolean> = {};
        fields.forEach(field => {
            allTouched[field.name] = true;
        });
        setTouched(allTouched);

        if (validateForm()) {
            await onSubmit(formData);
        }
    };

    // Handle file change
    const handleFileChange = (name: string, files: FileList | null, multiple: boolean) => {
        if (files) {
            handleChange(name, multiple ? Array.from(files) : files[0]);
        } else {
            handleChange(name, multiple ? [] : null);
        }
    };

    // Remove file
    const removeFile = (name: string, index?: number) => {
        const field = fields.find(f => f.name === name);
        if (field?.multiple && typeof index === 'number') {
            const newFiles = [...(formData[name] || [])];
            newFiles.splice(index, 1);
            handleChange(name, newFiles);
        } else {
            handleChange(name, null);
            if (fileInputRefs.current[name]) {
                fileInputRefs.current[name]!.value = '';
            }
        }
    };

    // Render field based on type
    const renderField = (field: DynamicFormField) => {
        const Icon = field.icon;
        const hasError = touched[field.name] && errors[field.name];
        const inputBaseClasses = `w-full px-4 py-3 bg-white/50 border-2 rounded-xl transition-all duration-200 
      focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500
      ${hasError ? 'border-red-400 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}
      ${field.disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${Icon ? 'pl-11' : ''}`;

        // Generate unique datalist ID
        const datalistId = field.datalist && field.datalist.length > 0 ? `datalist-${field.name}` : undefined;

        switch (field.type) {
            case 'textarea':
                return (
                    <div className="relative">
                        {Icon && (
                            <Icon className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                        )}
                        <textarea
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={field.disabled}
                            rows={field.rows || 4}
                            className={inputBaseClasses}
                        />
                    </div>
                );

            case 'select':
                return (
                    <div className="relative">
                        {Icon && (
                            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                        )}
                        <select
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            required={field.required}
                            disabled={field.disabled}
                            className={`${inputBaseClasses} appearance-none cursor-pointer`}
                        >
                            <option value="" disabled>
                                {field.placeholder || 'Select an option'}
                            </option>
                            {field.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                );

            case 'checkbox':
                return (
                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                name={field.name}
                                checked={formData[field.name] || false}
                                onChange={(e) => handleChange(field.name, e.target.checked)}
                                onBlur={() => handleBlur(field.name)}
                                disabled={field.disabled}
                                className="sr-only peer"
                            />
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-md peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-200 group-hover:border-indigo-400 peer-focus:ring-4 peer-focus:ring-indigo-500/20">
                                <svg className="w-full h-full text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-gray-700 select-none">{field.label}</span>
                    </label>
                );

            case 'switch':
                return (
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-gray-700 select-none">{field.label}</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                name={field.name}
                                checked={formData[field.name] || false}
                                onChange={(e) => handleChange(field.name, e.target.checked)}
                                onBlur={() => handleBlur(field.name)}
                                disabled={field.disabled}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-gray-300 rounded-full peer-checked:bg-indigo-500 transition-all duration-300 peer-focus:ring-4 peer-focus:ring-indigo-500/20">
                                <div className="w-5 h-5 bg-white rounded-full shadow-md absolute top-1 left-1 transition-transform duration-300 peer-checked:translate-x-7"></div>
                            </div>
                        </div>
                    </label>
                );

            case 'radio':
                return (
                    <div className="space-y-3">
                        {field.options?.map((option) => (
                            <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="radio"
                                        name={field.name}
                                        value={option.value}
                                        checked={formData[field.name] === option.value}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        onBlur={() => handleBlur(field.name)}
                                        disabled={field.disabled}
                                        className="sr-only peer"
                                    />
                                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full peer-checked:border-indigo-500 transition-all duration-200 group-hover:border-indigo-400 peer-focus:ring-4 peer-focus:ring-indigo-500/20">
                                        <div className="w-3 h-3 bg-indigo-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                                    </div>
                                </div>
                                <span className="text-gray-700 select-none">{option.label}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'file':
                return (
                    <div className="space-y-3">
                        <label className="block">
                            <input
                                ref={(el) => { fileInputRefs.current[field.name] = el; }}
                                type="file"
                                name={field.name}
                                onChange={(e) => handleFileChange(field.name, e.target.files, field.multiple || false)}
                                onBlur={() => handleBlur(field.name)}
                                accept={field.accept}
                                multiple={field.multiple}
                                disabled={field.disabled}
                                className="sr-only"
                            />
                            <div className={`flex items-center justify-center px-6 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${hasError ? 'border-red-400 bg-red-50/50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'}`}>
                                <div className="text-center">
                                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-600">
                                        {field.placeholder || 'Click to upload or drag and drop'}
                                    </p>
                                    {field.accept && (
                                        <p className="text-xs text-gray-400 mt-1">{field.accept}</p>
                                    )}
                                </div>
                            </div>
                        </label>

                        {/* Display selected files */}
                        {field.multiple && formData[field.name]?.length > 0 && (
                            <div className="space-y-2">
                                {formData[field.name].map((file: File, index: number) => (
                                    <div key={index} className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg">
                                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(field.name, index)}
                                            className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!field.multiple && formData[field.name] && (
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg">
                                <span className="text-sm text-gray-700 truncate">{formData[field.name].name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(field.name)}
                                    className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 'date':
                return (
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="date"
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            min={field.min?.toString()}
                            max={field.max?.toString()}
                            required={field.required}
                            disabled={field.disabled}
                            className={inputBaseClasses}
                        />
                    </div>
                );

            case 'time':
                return (
                    <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="time"
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            required={field.required}
                            disabled={field.disabled}
                            className={inputBaseClasses}
                        />
                    </div>
                );

            case 'datetime-local':
                return (
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="datetime-local"
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            min={field.min?.toString()}
                            max={field.max?.toString()}
                            required={field.required}
                            disabled={field.disabled}
                            className={inputBaseClasses}
                        />
                    </div>
                );

            case 'range':
                return (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{field.min}</span>
                            <span className="text-sm font-semibold text-indigo-600">{formData[field.name] || field.min || 0}</span>
                            <span className="text-sm text-gray-600">{field.max}</span>
                        </div>
                        <input
                            type="range"
                            name={field.name}
                            value={formData[field.name] || field.min || 0}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            disabled={field.disabled}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                );

            case 'color':
                return (
                    <div className="flex items-center space-x-3">
                        <input
                            type="color"
                            name={field.name}
                            value={formData[field.name] || '#000000'}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            disabled={field.disabled}
                            className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                        />
                        <input
                            type="text"
                            value={formData[field.name] || '#000000'}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            placeholder="#000000"
                            className="flex-1 px-4 py-3 bg-white/50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                );

            case 'password':
                return (
                    <div className="relative">
                        {Icon && (
                            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        )}
                        <input
                            type={showPassword[field.name] ? 'text' : 'password'}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={field.disabled}
                            pattern={field.pattern}
                            className={`${inputBaseClasses} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword[field.name] ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                );

            default:
                // text, email, number, tel, url - WITH DATALIST SUPPORT
                return (
                    <>
                        <div className="relative">
                            {Icon && (
                                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            )}
                            <input
                                type={field.type}
                                name={field.name}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                onBlur={() => handleBlur(field.name)}
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={field.disabled}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                pattern={field.pattern}
                                list={datalistId}
                                className={inputBaseClasses}
                            />
                        </div>
                        {/* Render datalist for autocomplete */}
                        {datalistId && (
                            <datalist id={datalistId}>
                                {field.datalist!.map((option, index) => (
                                    <option key={index} value={option} />
                                ))}
                            </datalist>
                        )}
                    </>
                );
        }
    };

    const gridClass = layout === 'grid' ? `grid gap-6 md:grid-cols-${gridCols}` : '';

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
            <div className={layout === 'grid' ? gridClass : 'space-y-6'}>
                {fields.map((field) => {
                    if (field.type === 'checkbox' || field.type === 'switch') {
                        return (
                            <div key={field.name} className={field.className || ''}>
                                {renderField(field)}
                                {field.helperText && (
                                    <p className="mt-2 text-sm text-gray-500">{field.helperText}</p>
                                )}
                                {touched[field.name] && errors[field.name] && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                        {errors[field.name]}
                                    </p>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div key={field.name} className={field.className || ''}>
                            <label htmlFor={field.name} className="block mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </span>
                            </label>
                            {renderField(field)}
                            {field.helperText && (
                                <p className="mt-2 text-sm text-gray-500">{field.helperText}</p>
                            )}
                            {touched[field.name] && errors[field.name] && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                    {errors[field.name]}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {showCancel && onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelLabel}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        submitLabel
                    )}
                </button>
            </div>
        </form>
    );
};

export default DynamicForm;