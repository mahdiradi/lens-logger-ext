import React from "react"
import { Common, Renderer } from "@k8slens/extensions"

const {
  Component: { MenuItem, Icon, SubMenu, StatusBrick },
  Navigation,
} = Renderer

type Pod = Renderer.K8sApi.Pod

export class PodLogs {

  /**
   * Get the container name list by a list of pods.
   *
   * @param podList
   * @returns a set, without duplicates
   */
  public static getContainersByPodList(pod: Pod): Set<string> {
    const containerNameList: Set<string> = new Set()
    const containers = pod.getContainers()
    for (let j = 0; j < containers.length; j++) {
      containerNameList.add(containers[j].name)
    }

    return containerNameList
  }

  /**
   * Construct the menu voices.
   *
   * @param props
   * @param containerNames
   * @param resourceNs
   * @param resourceName
   * @param resourceTitle
   * @returns the MenuItem to show in Lens
   */
  public static uiMenu(
    props: any,
    containerNames: Set<string>,
    resourceNs: string,
    resourceName: string,
    resourceTitle: string
  ) {
    return (
      <MenuItem
        onClick={Common.Util.prevDefault(() =>
          this.podLogs(resourceNs, resourceName, resourceTitle, Array.from(containerNames)?.slice(-1)[0])
        )}
      >
        <Icon
          material="subject"
          interactive={props.toolbar}
          tooltip="Logs w/Bunyan"
        />
        <span className="title">Logs</span>
        {
          containerNames.size >= 1 && (
            <>
              <Icon material="keyboard_arrow_right" />
              <SubMenu>
                {Array.from(containerNames).map((containerName) => {
                  return (
                    <MenuItem
                      key={`only_${containerName}`}
                      onClick={Common.Util.prevDefault(() =>
                        this.podLogs(
                          resourceNs,
                          resourceName,
                          resourceTitle,
                          containerName
                        )
                      )}
                    >
                      <StatusBrick />
                      <span>{containerName}</span>
                    </MenuItem>
                    <MenuItem
                      key={`only_save_${containerName}`}
                      onClick={Common.Util.prevDefault(() =>
                        this.savePodLogs(
                          resourceNs,
                          resourceName,
                          resourceTitle,
                          containerName
                        )
                      )}
                    >
                      <StatusBrick />
                      <span>save log {containerName}</span>
                    </MenuItem>
                  )
                })}
              </SubMenu>
            </>
          )
        }
      </MenuItem>
    )
  }

  private static podLogs(
    resourceNs: string,
    resourceName: string,
    resourceTitle: string,
    containerName?: string
  ) {
    // Generate log command with bunyan
    const cmd = `kubectl logs -f -n ${resourceNs} ${resourceName} -c ${containerName} --tail=300`

    // Open new terminal
    this.openTerminal(
      `${resourceTitle}: ${resourceName}:${containerName}`,
      cmd
    )
  }

  private static savePodLogs(
    resourceNs: string,
    resourceName: string,
    resourceTitle: string,
    containerName?: string
  ) {

    // Generate log command
    const tempFilePath = `C:\\Windows\\Temp\\${resourceName}_${containerName}.txt`
    const cmd = `kubectl logs -n ${resourceNs} ${resourceName} -c ${containerName} > "${tempFilePath}"`

    // Delay to ensure logs are written, then open the file
    setTimeout(() => {
      this.openTerminal("Open Log File", `notepad "${tempFilePath}"`)
    }, 3000) // Adjust delay as needed    
  }

  private static openTerminal(title: string, command: string) {
    const tab = Renderer.Component.createTerminalTab({
      title: title,
    })

    Renderer.Component.terminalStore.sendCommand(command, {
      enter: true,
      tabId: tab.id,
    })

    Renderer.Navigation.hideDetails()
  }
}
