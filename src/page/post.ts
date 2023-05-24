import { documentFunction, sakura } from "../main";
import { Util } from "../utils/util";

export default class Post {
  /**
   * 注册原创文章复制携带版权功能
   */
  @documentFunction()
  public registerOriginalPostCopy() {
    const contentElement = document.querySelector(".entry-content") as HTMLElement;
    if (!contentElement) {
      return;
    }
    // TODO 校验是否为原创文章
    if (!sakura.getThemeConfig("post", "post_original_copy", Boolean)) {
      return;
    }
    contentElement.addEventListener("copy", (event) => {
      event.preventDefault();
      const selection = window.getSelection();
      if (!selection) {
        return;
      }
      const selectedText = selection.toString();
      if (!selectedText || selectedText.length < 30) {
        return;
      }
      const postArticleElement = document.querySelector(".post-article") as HTMLElement;
      if (!postArticleElement) {
        return;
      }
      let copyrightTemplateHtml = `
      # 商业转载请联系作者获得授权，非商业转载请注明出处。<br>
      # For commercial use, please contact the author for authorization. For non-commercial use, please indicate the source.<br>
      # 协议(License): 署名-非商业性使用-相同方式共享 4.0 国际 (CC BY-NC-SA 4.0)<br>
      # 作者(Author): ${postArticleElement.getAttribute("data-owner")} <br>
      # 链接(URL): ${postArticleElement.getAttribute("data-url")}  <br>
      # 来源(Source): ${postArticleElement.getAttribute("data-siteName")} <br>
      <br>
      `;
      const copyText = selection.toString();
      const htmlStr = `${copyrightTemplateHtml}${copyText.replace(/\r\n/g, "<br>")}`;
      const textStr = `${copyrightTemplateHtml.replace(/<br>/g, "\n")}${copyText.replace(/\r\n/g, "\n")}`;
      if (event.clipboardData) {
        event.clipboardData.setData("text/html", htmlStr);
        event.clipboardData.setData("text/plain", textStr);
      }
    });
  }

  /**
   * 文章分享页，微信二维码生成
   */
  @documentFunction(false)
  public async registerShareWechat() {
    const shareWechatElement = document.getElementById("qrcode");
    if (!shareWechatElement) {
      return;
    }
    const QRCode = await import("qrcode");
    QRCode.toCanvas(shareWechatElement, shareWechatElement.getAttribute("data-url"), {
      width: 120,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  }

  /**
   * 注册文章阅读字数提醒功能
   */
  @documentFunction()
  public registerWordCountToast() {
    if (!sakura.getThemeConfig("post", "post_word_count_toast", Boolean)) {
      return;
    }

    const contentElement = document.querySelector(".entry-content") as HTMLElement;
    if (!contentElement) {
      return;
    }

    const postWordCount = Util.getWordCount(contentElement);
    if (postWordCount > 0) {
      const seconds = Util.caclEstimateReadTime(postWordCount);
      let remind = "";
      let type = "NORMAL" as "NORMAL" | "MEDIUM" | "DIFFICULTY";
      if (seconds <= 60 * 10) {
        remind = (
          sakura.getThemeConfig("post", "post_word_count_toast_normal", String) || "文章篇幅适中，可以放心阅读。"
        ).toString();
        type = "NORMAL";
      } else if (seconds > 60 * 10 && seconds <= 60 * 30) {
        remind = (
          sakura.getThemeConfig("post", "post_word_count_toast_medium", String) || "文章比较长，建议分段阅读。"
        ).toString();
        type = "MEDIUM";
      } else {
        remind = (
          sakura.getThemeConfig("post", "post_word_count_toast_difficulty", String) ||
          "文章内容已经很陈旧了，也许不再适用！"
        ).toString();
        type = "DIFFICULTY";
      }
      const timeString = Util.minuteToTimeString(seconds);
      if (window.innerWidth <= 860) {
        remind = "";
      }
      this.createPostToast(
        contentElement,
        `文章共 <b>${postWordCount}</b> 字，阅读完预计需要 <b>${timeString}</b>。${remind}`,
        type,
        "word_count"
      );
    }
  }

  /**
   * 注册文章最近更新时间提醒功能
   */
  @documentFunction()
  public registerEditTimeToast(pageConfig: Map<String, any>) {
    const contentElement = document.querySelector(".entry-content") as HTMLElement;
    if (!contentElement) {
      return;
    }

    if (!sakura.getThemeConfig("post", "post_edit_time_toast", Boolean)) {
      return;
    }

    if (!pageConfig.has("postLastModifyTime")) {
      return;
    }
    const postLastModifyTime = pageConfig.get("postLastModifyTime");
    const editTime = new Date(postLastModifyTime);
    const time = new Date().getTime() - editTime.getTime();
    let remind = "";
    let type = "NORMAL" as "NORMAL" | "MEDIUM" | "DIFFICULTY";
    if (time <= 1000 * 60 * 60 * 24 * 30) {
      remind = (
        sakura.getThemeConfig("post", "post_edit_time_toast_normal", String) || "近期有所更新，请放心阅读！"
      ).toString();
      type = "NORMAL";
    } else if (time > 1000 * 60 * 60 * 24 * 30 && time <= 1000 * 60 * 60 * 24 * 90) {
      remind = (
        sakura.getThemeConfig("post", "post_edit_time_toast_medium", String) ||
        "文章内容已经有一段时间没有更新了，也许不再适用！"
      ).toString();
      type = "MEDIUM";
    } else {
      remind = (
        sakura.getThemeConfig("post", "post_edit_time_toast_difficulty", String) ||
        "文章内容已经很陈旧了，也许不再适用！"
      ).toString();
      type = "DIFFICULTY";
    }
    if (window.innerWidth <= 860) {
      remind = "";
    }
    const sinceLastTime = Util.timeAgo(time);
    this.createPostToast(
      contentElement,
      `文章内容上次编辑时间于 <b>${sinceLastTime}</b>。${remind}`,
      type,
      "last_time"
    );
  }

  private createPostToast(
    parentElement: HTMLElement,
    message: string,
    type: "NORMAL" | "MEDIUM" | "DIFFICULTY",
    className?: string
  ) {
    const types = {
      NORMAL: "rgba(167, 210, 226, 1)",
      MEDIUM: "rgba(255, 197, 160, 1)",
      DIFFICULTY: "rgba(239, 206, 201, 1)",
    };
    const toastDivString = `<div class="${className} minicode" style="background-color: ${types[type]}">
      <span class="content-toast">
        ${message}
      </span>
      <div class="hide-minicode">
        <span class="iconify iconify--small" data-icon="fa:times"></span>
      </div>
    </div>`;
    if (parentElement.querySelector(`.${className}`)) {
      return;
    }
    const parse = new DOMParser();
    const toastDocument = parse.parseFromString(toastDivString, "text/html");
    const toastElement = toastDocument.querySelector(`.${className}`) as HTMLElement;
    const hideMinicode = toastElement.querySelector(".hide-minicode") as HTMLElement;
    hideMinicode.addEventListener(
      "click",
      () => {
        toastElement.classList.add("hide");
      },
      { once: true }
    );
    parentElement.insertAdjacentElement("afterbegin", toastElement);
  }
}