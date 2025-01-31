const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const { initialBlogs, blogsInDb, nonExistingId } = require('./test_helper')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

beforeEach(async () => {
    await Blog.deleteMany({})
    console.log('cleared')

    for (let blog of initialBlogs) {
        let blogObject = new Blog(blog)
        await blogObject.save()
    }
    console.log('done')
})

test('blogs returned as json', async () => {
    console.log('tests started')
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('there are six blogs', async () => {
    const response = await api.get('/api/blogs')
    assert.strictEqual(response.body.length, initialBlogs.length)
})

test('unique identifiers are named id', async () => {
    const response = await api.get('/api/blogs')
    assert(response.body[0].id)
})

test('a blog can be added', async () => {
    const newBlog = {
        title: 'Test Blog',
        author: 'Test Author',
        url: 'https://backend-test-mv5f.onrender.com/',
        likes: 2,
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)

    const blogsAtEnd = await blogsInDb()
    assert.strictEqual(blogsAtEnd.length, initialBlogs.length + 1)

    const finalTitles = blogsAtEnd.map(blog => blog.title)
    assert(finalTitles.includes('Test Blog'))
})

test('if likes is missing, return 0', async () => {
    const newBlog = {
        title: 'Test Blog',
        author: 'Test Author',
        url: 'https://backend-test-mv5f.onrender.com/',
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)

    const finalBlogs = await blogsInDb()
    const likes = (finalBlogs).map(blog => blog.likes)

    assert.strictEqual(likes[finalBlogs.length - 1], 0)
})

test('trying to add invalid blog', async () => {
    const newBlog = {
        url: 'https://backend-test-mv5f.onrender.com/',
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)
})

test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await blogsInDb()

        assert.strictEqual(blogsAtEnd.length, initialBlogs.length - 1)

        const titles = blogsAtEnd.map(r => r.title)
        assert(!titles.includes(blogToDelete.title))
})

test('fails with status code 400 if id is invalid', async () => {
    const invalidId = '5a3d5da590'

    await api
        .delete(`/api/blogs/${invalidId}`)
        .expect(400)
})

test('updating number of likes', async () => {
    const blogsAtStart = await blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    const newBlog = {
        ...blogToUpdate,
        likes: blogToUpdate.likes + 1
    }

    await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(newBlog)
    
    const blogsAtEnd = await blogsInDb()
    assert.strictEqual(blogsAtEnd[0].likes, blogsAtStart[0].likes+1)
})

after(async () => { await mongoose.connection.close() })