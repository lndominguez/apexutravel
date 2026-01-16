import { getMessaging } from './firebase-admin'
import { User } from '@/models'
import mongoose from 'mongoose'

interface SendPushNotificationParams {
  userId: string | mongoose.Types.ObjectId
  title: string
  body: string
  icon?: string
  imageUrl?: string
  clickAction?: string
  data?: Record<string, string>
}

export async function sendPushNotification(params: SendPushNotificationParams): Promise<boolean> {
  try {
    console.log('📱 [PUSH] Intentando enviar push notification:', {
      userId: params.userId,
      title: params.title
    })

    const messaging = getMessaging()
    
    if (!messaging) {
      console.warn('⚠️ [PUSH] Firebase Messaging not initialized. Skipping push notification.')
      return false
    }

    console.log('✅ [PUSH] Firebase Messaging initialized')

    const user = await User.findById(params.userId).select('fcmTokens email')
    
    if (!user) {
      console.log(`❌ [PUSH] User not found: ${params.userId}`)
      return false
    }

    console.log(`👤 [PUSH] User found: ${user.email}, FCM tokens: ${user.fcmTokens?.length || 0}`)
    
    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`ℹ️ [PUSH] No FCM tokens found for user ${user.email}`)
      return false
    }

    const message = {
      notification: {
        title: params.title,
        body: params.body,
        ...(params.imageUrl && { image: params.imageUrl })
      },
      webpush: params.clickAction ? {
        fcmOptions: {
          link: params.clickAction
        }
      } : undefined,
      data: params.data || {},
      tokens: user.fcmTokens
    }

    const response = await messaging.sendEachForMulticast(message)

    console.log(`✅ Push notification sent: ${response.successCount} success, ${response.failureCount} failures`)

    if (response.failureCount > 0) {
      console.log('❌ [PUSH] Detalles de fallos:')
      const tokensToRemove: string[] = []
      
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error
          console.log(`   - Token ${idx}: ${error?.code} - ${error?.message}`)
          if (
            error?.code === 'messaging/invalid-registration-token' ||
            error?.code === 'messaging/registration-token-not-registered'
          ) {
            tokensToRemove.push(user.fcmTokens![idx])
          }
        }
      })

      if (tokensToRemove.length > 0) {
        user.fcmTokens = user.fcmTokens.filter(token => !tokensToRemove.includes(token))
        await user.save()
        console.log(`🗑️ Removed ${tokensToRemove.length} invalid FCM tokens for user ${user.email}`)
      }
    }

    return response.successCount > 0

  } catch (error) {
    console.error('❌ Error sending push notification:', error)
    return false
  }
}

export async function sendPushToMultipleUsers(
  userIds: (string | mongoose.Types.ObjectId)[],
  title: string,
  body: string,
  options?: {
    icon?: string
    imageUrl?: string
    clickAction?: string
    data?: Record<string, string>
  }
): Promise<{ successCount: number; failureCount: number }> {
  let successCount = 0
  let failureCount = 0

  const promises = userIds.map(async (userId) => {
    const success = await sendPushNotification({
      userId,
      title,
      body,
      ...options
    })
    
    if (success) {
      successCount++
    } else {
      failureCount++
    }
  })

  await Promise.all(promises)

  return { successCount, failureCount }
}
