# Supabase Storage Setup for File Uploads

## 1. Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **"New bucket"**
4. Configure the bucket:
   ```
   Name: student-documents
   Public: ✅ (checked)
   File size limit: 52428800 (50MB)
   Allowed MIME types: image/jpeg,image/png,image/gif,image/webp
   ```

## 2. Set Bucket Policies

Go to **Storage** → **Policies** and create these policies:

### Allow Public Read Access

```sql
CREATE POLICY "Public read access for student documents" ON storage.objects
FOR SELECT USING (bucket_id = 'student-documents');
```

### Allow Authenticated Upload

```sql
CREATE POLICY "Allow authenticated users to upload student documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'student-documents'
  AND auth.role() = 'authenticated'
);
```

### Allow Users to Update Their Own Files

```sql
CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'student-documents'
  AND auth.role() = 'authenticated'
);
```

### Allow Users to Delete Their Own Files

```sql
CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'student-documents'
  AND auth.role() = 'authenticated'
);
```

## 3. Environment Variables

Make sure your `.env.local` has these Supabase variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 4. File Structure

After setup, uploaded files will be organized as:

```
student-documents/
  └── passport-photos/
      └── {student-id}/
          └── {timestamp}.{extension}
```

## 5. Testing File Upload

1. Start your development server: `npm run dev`
2. Go to the registration page
3. Complete the form and try uploading a passport photo
4. Check your Supabase Storage dashboard to see the uploaded file

## 6. File Size and Type Restrictions

- **Maximum file size**: 5MB (configurable in FileUpload component)
- **Allowed types**: JPG, PNG, GIF, WebP
- **Storage limit**: 50MB per bucket (can be increased in Supabase settings)

## 7. Error Handling

The system handles these scenarios:

- File too large → Toast error message
- Invalid file type → Toast error message
- Upload failure → Continues registration without photo
- Network issues → Graceful degradation

## 8. Production Considerations

For production deployment:

1. Consider using CDN for faster image delivery
2. Implement image optimization/resizing
3. Set up monitoring for storage usage
4. Configure backup policies
5. Review and tighten security policies as needed
