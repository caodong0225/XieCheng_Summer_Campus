// src/controllers/NoteController.js
const NoteService = require('../service/NoteService');
const response = require('../utils/response');
const {getContext} = require("../utils/requestContext");

class NoteController {
    constructor() {
        this.noteService = new NoteService();

        this.createNote = this.createNote.bind(this);
        this.reviewNote = this.reviewNote.bind(this);
        this.deleteNote = this.deleteNote.bind(this);
        this.updateNote = this.updateNote.bind(this);
        this.deleteAttachment = this.deleteAttachment.bind(this);
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
}

module.exports = new NoteController();