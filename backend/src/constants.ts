// import { config } from '@src/config';

// export const MONGO_DATABASE_URL =`mongodb+srv://georgekinoti254:${encodeURIComponent(
//    ''
// )}@cluster0.v5pwujv.mongodb.net/?retryWrites=true&w=majority`;

export const BASE_PATH = '/api/v1';

// JOB NAMES
export const ADD_AUTH_USER_TO_JOB = 'addAuthUserToJob';
export const ADD_USER_POST_TO_JOB = 'addUserPostToJob';
export const DELETE_USER_POST_TO_JOB = 'deleteUserPostToJob';
export const EDIT_USER_POST_TO_JOB = 'editUserPostToJob';

export const ADD_REACTION_TO_DB_JOB = 'addUserReactionToDbJob';
export const REMOVE_REACTION_FROM_DB_JOB = 'removeUserReactionFromDbJob';

// FOLLOWERS JOB

export const ADD_FOLLOWER_TO_DB_JOB = 'addFollowersToDbJob';
export const REMOVE_FOLLOWER_FROM_DB_JOB = 'removeFollowerFromDB';
export const ADD_BLOCKED_USER_TO_DB = 'addBlockedUserToDB';
export const REMOVE_BLOCKED_USER_FROM_DB = 'removeBlockedUserFromDB';

// COMMENT JOB

export const ADD_COMMENT_TO_DB_JOB = 'addUserCommentToDbJob';

// EMAIL JOB NAMES

export const ADD_EMAIL_TO_JOB = 'addemailToJob';
export const FORGOT_PASSWORD = 'forgotPassword';
export const COMMENT_EMAIL = 'commentsEmail';
export const FOLLOWERS_EMAIL = 'followersEmail';
export const REACTIONS_EMAIL = 'reactionsEmail';
export const DIRECT_MESSAGE_EMAIL = 'directMessageEmail';
export const CHANGE_PASSWORD = 'changePassword';


// NOTIFICATION JOB NAMES

export const UPDATE_NOTIFICATION = 'updateNotification';
export const DELETE_NOTIFICATION = 'deleteNotification';

// IMAGE JOB NAMES
export const ADD_USER_PROFILE_IMAGE_TO_DB_JOB = 'addUserProfileImageToDB';
export const UPDATE_BACKGROUND_IMAGE_TO_DB_JOB = 'updateBGImageInDB';
export const ADD_IMAGE_TO_DB_JOB = 'addImageToDB';
export const REMOVE_IMAGE_FROM_DB_JOB = 'removeImageFromDB';

// CHAT JOB NAMES
export const ADD_CHAT_MESSAGE_TO_DB_JOB = 'addChatMessageToDB';
export const MARK_MESSAGEAS_DELETED_IN_DB_TO_DB_JOB = 'markMessageAsDeletedInDB';
export const MARK_MESSAGEAS_AS_READ_IN_DB_JOB = 'markMessagesAsReadInDB';
export const UPDATE_MESSAGE_REACTION = 'updateMessageReaction';


// USER JOB NAMES
export const ADD_USER_TO_JOB = 'addUserToJob';
export const UPDATE_BASIC_USER_INFO_TO_JOB = 'updateBasicUserInfoToJob';
export const UPDATE_USER_SOCIAL_INFO_TO_JOB = 'updateUserSocialInfoToJob';
export const UPDATE_USER_NOTIFICATION_SETTINGS = 'updateUserNotificationSettingsToJob';


// EMAIL RECEIVER

export const RECEIVER_EMAIL = 'hillary.fritsch23@ethereal.email';
