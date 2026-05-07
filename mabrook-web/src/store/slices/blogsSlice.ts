import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  createBlog,
  deleteBlog,
  listBlogs,
  updateBlog,
  type BlogPayload,
} from '../../lib/api/realServices'

type BlogsState = {
  items: BlogPayload[]
  loading: boolean
  error: string
}

const initialState: BlogsState = {
  items: [],
  loading: false,
  error: '',
}

export const fetchBlogs = createAsyncThunk('blogs/fetch', async () => {
  const response = await listBlogs()
  return response.data
})

export const createBlogThunk = createAsyncThunk(
  'blogs/create',
  async (input: { title: string; body: string; tags?: string[] }) => {
    const response = await createBlog(input)
    return response.data
  },
)

export const updateBlogThunk = createAsyncThunk(
  'blogs/update',
  async (input: { blogId: string; title: string; body: string; tags?: string[] }) => {
    const response = await updateBlog(input.blogId, {
      title: input.title,
      body: input.body,
      tags: input.tags,
    })
    return response.data
  },
)

export const deleteBlogThunk = createAsyncThunk('blogs/delete', async (blogId: string) => {
  await deleteBlog(blogId)
  return blogId
})

const blogsSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load blogs.'
      })
      .addCase(createBlogThunk.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items]
      })
      .addCase(updateBlogThunk.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        )
      })
      .addCase(deleteBlogThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload)
      })
  },
})

export const blogsReducer = blogsSlice.reducer
