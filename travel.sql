/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42)
 Source Host           : localhost:3306
 Source Schema         : travel

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42)
 File Encoding         : 65001

 Date: 13/06/2025 20:56:55
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for note_emoji_reactions
-- ----------------------------
DROP TABLE IF EXISTS `note_emoji_reactions`;
CREATE TABLE `note_emoji_reactions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户id',
  `note_id` int NOT NULL COMMENT '帖子id',
  `emoji` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '表情',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `note_emoji_reactions_notes_id_fk`(`note_id` ASC) USING BTREE,
  INDEX `note_emoji_reactions_users_id_fk`(`user_id` ASC) USING BTREE,
  CONSTRAINT `note_emoji_reactions_notes_id_fk` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `note_emoji_reactions_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子的表情回复' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for notes
-- ----------------------------
DROP TABLE IF EXISTS `notes`;
CREATE TABLE `notes`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标题',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `del_flag` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识（0未删除，1已删除）',
  `created_by` int NOT NULL COMMENT '创建人',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '内容',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `notes_users_id_fk`(`created_by` ASC) USING BTREE,
  INDEX `notes_title_index`(`title` ASC) USING BTREE,
  CONSTRAINT `notes_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '游记表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for notes_attachment
-- ----------------------------
DROP TABLE IF EXISTS `notes_attachment`;
CREATE TABLE `notes_attachment`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `note_id` int NOT NULL COMMENT '游记的键值',
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '键名称',
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '键值',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `weight` int NOT NULL DEFAULT 0 COMMENT '显示权重',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `notes_attachment_notes_id_fk`(`note_id` ASC) USING BTREE,
  CONSTRAINT `notes_attachment_notes_id_fk` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `key_check` CHECK ((`key` = _utf8mb4'picture') or (`key` = _utf8mb4'video'))
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '游记的附件' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for notes_status
-- ----------------------------
DROP TABLE IF EXISTS `notes_status`;
CREATE TABLE `notes_status`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '状态',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '理由（若为拒绝状态）',
  `note_id` int NULL DEFAULT NULL COMMENT '游记id',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `notes_status_notes_id_fk`(`note_id` ASC) USING BTREE,
  CONSTRAINT `notes_status_notes_id_fk` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `status_check` CHECK ((`status` = _utf8mb4'checking') or (`status` = _utf8mb4'rejected') or (`status` = _utf8mb4'approved'))
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '游记状态' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标题',
  `content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '通知内容',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `user_id` int NOT NULL COMMENT '通知的对象',
  `is_read` tinyint NOT NULL DEFAULT 0 COMMENT '是否已读(0未读，1已读)',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `notifications_users_id_fk`(`user_id` ASC) USING BTREE,
  CONSTRAINT `notifications_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '通知表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for thread_emoji_reactions
-- ----------------------------
DROP TABLE IF EXISTS `thread_emoji_reactions`;
CREATE TABLE `thread_emoji_reactions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户id',
  `thread_id` int NOT NULL COMMENT '帖子id',
  `emoji` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '表情',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `thread_emoji_reactions_threads_id_fk`(`thread_id` ASC) USING BTREE,
  INDEX `thread_emoji_reactions_users_id_fk`(`user_id` ASC) USING BTREE,
  CONSTRAINT `thread_emoji_reactions_threads_id_fk` FOREIGN KEY (`thread_id`) REFERENCES `threads` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `thread_emoji_reactions_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子表情回复表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for thread_replies
-- ----------------------------
DROP TABLE IF EXISTS `thread_replies`;
CREATE TABLE `thread_replies`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NULL DEFAULT NULL COMMENT '用户id',
  `thread_id` int NULL DEFAULT NULL COMMENT '父帖子id',
  `reply_id` int NULL DEFAULT NULL COMMENT '父回复id',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '内容',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `thread_replies_thread_replies_id_fk`(`reply_id` ASC) USING BTREE,
  INDEX `thread_replies_threads_id_fk`(`thread_id` ASC) USING BTREE,
  INDEX `thread_replies_users_id_fk`(`user_id` ASC) USING BTREE,
  CONSTRAINT `thread_replies_thread_replies_id_fk` FOREIGN KEY (`reply_id`) REFERENCES `thread_replies` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `thread_replies_threads_id_fk` FOREIGN KEY (`thread_id`) REFERENCES `threads` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `thread_replies_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子回复' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for thread_reply_emoji_reactions
-- ----------------------------
DROP TABLE IF EXISTS `thread_reply_emoji_reactions`;
CREATE TABLE `thread_reply_emoji_reactions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户id',
  `thread_reply_id` int NULL DEFAULT NULL COMMENT '回复id',
  `emoji` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '表情',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `thread_reply_emoji_reactions_thread_replies_id_fk`(`thread_reply_id` ASC) USING BTREE,
  INDEX `thread_reply_emoji_reactions_users_id_fk`(`user_id` ASC) USING BTREE,
  CONSTRAINT `thread_reply_emoji_reactions_thread_replies_id_fk` FOREIGN KEY (`thread_reply_id`) REFERENCES `thread_replies` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `thread_reply_emoji_reactions_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for threads
-- ----------------------------
DROP TABLE IF EXISTS `threads`;
CREATE TABLE `threads`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '内容',
  `user_id` int NULL DEFAULT NULL COMMENT '用户id',
  `note_id` int NOT NULL COMMENT '游记id',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'open' COMMENT '评论状态',
  `weight` int NOT NULL DEFAULT 0 COMMENT '评论优先级',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `threads_notes_id_fk`(`note_id` ASC) USING BTREE,
  INDEX `threads_users_id_fk`(`user_id` ASC) USING BTREE,
  CONSTRAINT `threads_notes_id_fk` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `threads_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '评论' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_exts
-- ----------------------------
DROP TABLE IF EXISTS `user_exts`;
CREATE TABLE `user_exts`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '键名称',
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '键值',
  `user_id` int NOT NULL COMMENT '用户id',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_exts_pk`(`key` ASC, `user_id` ASC) USING BTREE,
  INDEX `user_exts_users_id_fk`(`user_id` ASC) USING BTREE,
  CONSTRAINT `user_exts_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `check_key` CHECK ((`key` = _utf8mb4'description') or (`key` = _utf8mb4'sex') or (`key` = _utf8mb4'phone'))
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表额外字段' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码的哈希值',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '邮箱',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `role` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'guest' COMMENT '角色',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `users_pk_3`(`email` ASC) USING BTREE,
  UNIQUE INDEX `users_pk_2`(`username` ASC) USING BTREE,
  INDEX `users_username_index`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;

DROP TABLE IF EXISTS `videos`;
create table videos
(
    id          int auto_increment comment '主键'
        primary key,
    created_at  timestamp default current_timestamp not null comment '创建时间',
    updated_at  timestamp default current_timestamp not null on update current_timestamp comment '更新时间',
    description varchar(255)                        null comment '视频描述',
    created_by  int                                 not null comment '创建者id',
    link        varchar(255)                        not null comment '视频地址',
    thumbnail   varchar(255)                        not null comment '缩略图地址',
    constraint videos_pk_2
        unique (link),
    constraint videos_pk_3
        unique (thumbnail),
    constraint videos_users_id_fk
        foreign key (created_by) references users (id)
            on delete cascade
)
    comment '视频列表';

DROP TABLE IF EXISTS `video_emoji_reactions`;
create table video_emoji_reactions
(
    id      int auto_increment comment '主键'
        primary key,
    user_id int          not null comment '用户id',
    video_id int          not null comment '帖子id',
    emoji   varchar(255) null comment '表情',
    constraint video_emoji_reactions_videos_id_fk
        foreign key (video_id) references videos (id)
            on delete cascade,
    constraint video_emoji_reactions_users_id_fk
        foreign key (user_id) references users (id)
            on delete cascade
)
    comment '视频的表情回复' row_format = DYNAMIC;
