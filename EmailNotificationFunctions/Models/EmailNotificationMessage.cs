using Newtonsoft.Json;

namespace EmailNotificationFunctions.Models
{
    public class EmailNotificationMessage
    {
        [JsonProperty("notificationType")]
        public string NotificationType { get; set; } = string.Empty;

        [JsonProperty("recipientUserId")]
        public Guid? RecipientUserId { get; set; }

        [JsonProperty("recipientEmail")]
        public string? RecipientEmail { get; set; }

        [JsonProperty("recipientUserIds")]
        public List<Guid>? RecipientUserIds { get; set; }

        [JsonProperty("templateKey")]
        public string TemplateKey { get; set; } = string.Empty;

        [JsonProperty("subject")]
        public string? Subject { get; set; }

        [JsonProperty("templateData")]
        public Dictionary<string, object>? TemplateData { get; set; }
    }
}
