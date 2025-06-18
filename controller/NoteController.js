// src/controllers/NoteController.js
const NoteService = require('../service/NoteService');
const response = require('../utils/response');
const {getContext} = require("../utils/requestContext");
const ThreadService = require("../service/ThreadService");

class NoteController {
    constructor() {
        this.noteService = new NoteService();
        this.threadService = new ThreadService();

        this.createNote = this.createNote.bind(this);
        this.reviewNote = this.reviewNote.bind(this);
        this.deleteNote = this.deleteNote.bind(this);
        this.updateNote = this.updateNote.bind(this);
        this.deleteAttachment = this.deleteAttachment.bind(this);
        this.auditNote = this.auditNote.bind(this);
        this.getNoteList = this.getNoteList.bind(this);
        this.getNoteById = this.getNoteById.bind(this);
        this.toggleCollection = this.toggleCollection.bind(this);
        this.toggleFavorite = this.toggleFavorite.bind(this);
        this.getNoteThreads = this.getNoteThreads.bind(this);
        this.getNoteAll = this.getNoteAll.bind(this);
    }

    async createNote(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const noteId = await this.noteService.createNote(
                contextUser.userId,
                req.body
            );
            response.success(res, { noteId }, '游记创建成功', 200);
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    async reviewNote(req, res) {
        try {
            const { noteId } = req.params;
            await this.noteService.reviewNote(noteId, req.body);
            response.success(res, null, '审核状态已更新');
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    async deleteNote(req, res) {
        try {
            const { noteId } = req.params;
            await this.noteService.deleteNote(noteId);
            response.success(res, null, '游记已删除');
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 更改游记内容
    async updateNote(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const { noteId } = req.params;
            if(contextUser.role !== 'admin' && contextUser.role !== 'super-admin'){
                await this.noteService.checkNotePermission(contextUser.userId, noteId)
            }
            await this.noteService.updateNote(noteId, req.body);
            response.success(res, null, '游记已更新');
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 删除游记附件
    async deleteAttachment(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const { attachmentId } = req.params;
            if(contextUser.role !== 'admin' && contextUser.role !== 'super-admin'){
                await this.noteService.checkAttachmentPermission(contextUser.userId, attachmentId)
            }
            await this.noteService.deleteAttachment(attachmentId);
            response.success(res, null, '附件已删除');
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 审计游记
    async auditNote(req, res) {
        try {
            const { noteId } = req.params;
            await this.noteService.auditNote(noteId, req.body);
            response.success(res, null, '游记已审核');
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 获取游记列表
    async getNoteList(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            if(req.query.created_by == undefined){
                req.query.created_by = contextUser.userId;
            }else{
                if(contextUser.role !== 'admin' && contextUser.role !== 'super-admin'){
                    req.query.created_by = contextUser.userId;
                }
            }

            const notes = await this.noteService.getNoteList(req.query);
            response.success(res, notes, '游记列表获取成功');
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 获取所有游记列表
    async getNoteAll(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const notes = await this.noteService.getNoteList(req.query);
            response.success(res, notes, '游记列表获取成功');
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 通过id获取游记
    async getNoteById(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const { noteId } = req.params;
            const note = await this.noteService.getNoteDetail(contextUser.userId, noteId);
            response.success(res, note, '游记获取成功');
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }


    // 收藏/取消收藏
    async toggleCollection(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const result = await this.threadService.toggleCollection(
                contextUser.userId,
                req.params.noteId
            );
            response.success(res, result);
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }

    // 点赞/取消点赞
    async toggleFavorite(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const result = await this.threadService.toggleFavorite(
                contextUser.userId,
                req.params.noteId
            );
            response.success(res, result);
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }

    // 通过id获取游记的评论列表
    async getNoteThreads(req, res) {
        try {
            const threads = await this.noteService.getThreadsWithRepliesByNote(req.params.noteId);
            response.success(res, threads, '评论列表获取成功');
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }
}

module.exports = new NoteController();
